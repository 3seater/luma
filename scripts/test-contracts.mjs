import assert from 'node:assert/strict';
import ganache from 'ganache';
import { createPublicClient, createWalletClient, custom, defineChain, encodeAbiParameters, keccak256, parseEther, zeroAddress } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { compile } from './compile-contracts.mjs';
const provider = ganache.provider({ logging: { quiet: true }, chain: { chainId: 5042, hardfork: 'shanghai' }, wallet: { totalAccounts: 4 } });
const chain = defineChain({ id: 5042, name: 'Local Arc simulation', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: ['http://localhost'] } } });
const publicClient = createPublicClient({ chain, transport: custom(provider), cacheTime: 0 });
const accounts = Object.values(provider.getInitialAccounts()).map(value => privateKeyToAccount(value.secretKey));
const [sender, recipient, attacker] = accounts;
const wallet = account => createWalletClient({ account, chain, transport: custom(provider) });
const extras = { 'Receivers.sol': { content: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
interface IEscrow { function claim(uint256,address,bytes calldata) external; function cancel(uint256) external; }
contract Reject { receive() external payable { revert("reject"); } }
contract Reenter { IEscrow public escrow; uint256 public id; bytes public sig; bool public blocked;
function setup(address e,uint256 i,bytes calldata s) external {escrow=IEscrow(e);id=i;sig=s;}
receive() external payable {try escrow.claim(id,address(this),sig) {} catch {blocked=true;}}
}` } };
const compiled = compile(extras);
const contract = compiled['ArcEscrow.sol'].ArcEscrow;
const deploy = async artifact => {
  const hash = await wallet(sender).deployContract({ abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}` });
  return (await publicClient.waitForTransactionReceipt({ hash })).contractAddress;
};
let checks = 0;
const check = (label, fn) => async () => { await fn(); checks++; console.log(`PASS ${label}`); };
try {
  const escrow = await deploy(contract);
  const otherEscrow = await deploy(contract);
  const signer = privateKeyToAccount(generatePrivateKey());
  const amount = parseEther('25.123456');
  const read = id => publicClient.readContract({ address: escrow, abi: contract.abi, functionName: 'getDeposit', args: [id] });
  const invoke = async (account, name, args, value, address = escrow) => {
    const { request } = await publicClient.simulateContract({ address, abi: contract.abi, functionName: name, args, value, account: account.address });
    const gas = await publicClient.estimateContractGas({ address, abi: contract.abi, functionName: name, args, value, account: account.address });
    const hash = await wallet(account).writeContract({ ...request, gas: gas * 120n / 100n });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    assert.equal(receipt.status, 'success'); return receipt;
  };
  const sign = (id, to, chainId = 5042, contractAddress = escrow, account = signer) => account.signMessage({ message: { raw: keccak256(encodeAbiParameters([{type:'uint256'},{type:'address'},{type:'uint256'},{type:'address'}],[BigInt(chainId),contractAddress,id,to])) } });
  await check('reject zero amount and zero claim signer', async () => {
    await assert.rejects(invoke(sender,'deposit',[signer.address],0n));
    await assert.rejects(invoke(sender,'deposit',[zeroAddress],amount));
  })();
  await check('deposit native USDC and retain exact amount', async () => {
    await invoke(sender,'deposit',[signer.address],amount);
    const item=await read(1n); assert.equal(item.sender.toLowerCase(),sender.address.toLowerCase()); assert.equal(item.amount,amount); assert.equal(item.status,1);
    assert.equal(await publicClient.getBalance({address:escrow}),amount);
  })();
  await check('reject wrong key, recipient, chain, escrow, deposit and malformed signature', async () => {
    for (const signature of [await sign(1n,recipient.address,5042,escrow,attacker),await sign(1n,attacker.address),await sign(1n,recipient.address,1),await sign(1n,recipient.address,5042,otherEscrow),await sign(2n,recipient.address),'0x1234']) await assert.rejects(invoke(attacker,'claim',[1n,recipient.address,signature]));
    assert.equal((await read(1n)).status,1);
  })();
  await check('reject missing deposits and non-sender cancellation', async () => {
    await assert.rejects(invoke(attacker,'cancel',[1n])); await assert.rejects(invoke(sender,'cancel',[999n]));
    await assert.rejects(invoke(recipient,'claim',[999n,recipient.address,await sign(999n,recipient.address)]));
  })();
  await check('relay claim pays only the signed recipient', async () => {
    const before=await publicClient.getBalance({address:recipient.address});
    await invoke(attacker,'claim',[1n,recipient.address,await sign(1n,recipient.address)]);
    assert.equal(await publicClient.getBalance({address:recipient.address})-before,amount);
    assert.equal((await read(1n)).status,2);
  })();
  await check('prevent double claim and cancellation after claim', async () => {
    await assert.rejects(invoke(recipient,'claim',[1n,recipient.address,await sign(1n,recipient.address)]));
    await assert.rejects(invoke(sender,'cancel',[1n]));
  })();
  await check('sender cancellation returns principal less transaction gas', async () => {
    await invoke(sender,'deposit',[signer.address],amount);
    const before=await publicClient.getBalance({address:sender.address});
    const receipt=await invoke(sender,'cancel',[2n]);
    assert.equal(await publicClient.getBalance({address:sender.address}),before+amount-receipt.gasUsed*receipt.effectiveGasPrice);
    assert.equal((await read(2n)).status,3);
    await assert.rejects(invoke(recipient,'claim',[2n,recipient.address,await sign(2n,recipient.address)]));
    await assert.rejects(invoke(sender,'cancel',[2n]));
  })();
  await check('failed recipient transfer preserves deposit and refundability', async () => {
    const reject=await deploy(compiled['Receivers.sol'].Reject);
    await invoke(sender,'deposit',[signer.address],amount);
    await assert.rejects(invoke(attacker,'claim',[3n,reject,await sign(3n,reject)]));
    for(const invalid of [zeroAddress,escrow]) await assert.rejects(invoke(attacker,'claim',[3n,invalid,await sign(3n,invalid)]));
    assert.equal((await read(3n)).status,1); await invoke(sender,'cancel',[3n]);
  })();
  await check('reentrancy cannot withdraw a deposit twice', async () => {
    const artifact=compiled['Receivers.sol'].Reenter;
    const receiver=await deploy(artifact);
    await invoke(sender,'deposit',[signer.address],amount);
    const signature=await sign(4n,receiver);
    const hash=await wallet(sender).writeContract({address:receiver,abi:artifact.abi,functionName:'setup',args:[escrow,4n,signature]}); await publicClient.waitForTransactionReceipt({hash});
    await invoke(attacker,'claim',[4n,receiver,signature]);
    assert.equal(await publicClient.readContract({address:receiver,abi:artifact.abi,functionName:'blocked'}),true);
    assert.equal(await publicClient.getBalance({address:receiver}),amount); assert.equal(await publicClient.getBalance({address:escrow}),0n);
  })();
  await check('new embedded recipient receives USDC with zero starting gas balance', async () => {
    const freshRecipient = privateKeyToAccount(generatePrivateKey());
    assert.equal(await publicClient.getBalance({ address: freshRecipient.address }), 0n);
    await invoke(sender, 'deposit', [signer.address], amount);
    await invoke(attacker, 'claim', [5n, freshRecipient.address, await sign(5n, freshRecipient.address)]);
    assert.equal(await publicClient.getBalance({ address: freshRecipient.address }), amount);
    assert.equal((await read(5n)).status, 2);
  })();
  console.log(`${checks} contract scenarios passed on a local EVM. This does not verify Arc-specific runtime behavior.`);
} finally { await provider.disconnect(); }
