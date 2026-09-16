import { encodeAbiParameters, keccak256, parseUnits, type Address, type Hex, isAddress, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
export type ClaimLink = { key: Hex; id: bigint; chainId: number; escrow: Address };
export function parseAmount(amount: string): bigint {
  if (!/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/.test(amount)) throw new Error('Enter a USDC amount with up to 6 decimal places.');
  const value = parseUnits(amount, 18);
  if (value <= 0n) throw new Error('Enter an amount greater than zero.');
  return value;
}
export function claimDigest(chainId: number, escrow: Address, id: bigint, recipient: Address) {
  return keccak256(encodeAbiParameters(
    [{ type: 'uint256' }, { type: 'address' }, { type: 'uint256' }, { type: 'address' }],
    [BigInt(chainId), escrow, id, recipient],
  ));
}
export function makeLink(origin: string, link: ClaimLink) {
  return `${origin}/claim#v=1&chain=${link.chainId}&escrow=${link.escrow}&id=${link.id}&key=${link.key.slice(2)}`;
}
export function parseLink(hash: string, chainId: number, escrow: Address): ClaimLink {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  for (const name of ['v', 'chain', 'escrow', 'id', 'key']) {
    if (params.getAll(name).length !== 1) throw new Error('This claim link is incomplete or invalid.');
  }
  if (params.get('v') !== '1') throw new Error('This link version is not supported.');
  if (params.get('chain') !== String(chainId)) throw new Error('This link belongs to a different network.');
  const contract = params.get('escrow')!;
  if (!isAddress(contract) || contract === zeroAddress || contract.toLowerCase() !== escrow.toLowerCase()) throw new Error('This link belongs to a different escrow.');
  const id = params.get('id')!;
  const key = params.get('key')!;
  if (!/^[1-9]\d{0,77}$/.test(id) || BigInt(id) >= 2n ** 256n || !/^[a-fA-F0-9]{64}$/.test(key)) throw new Error('This claim link is invalid.');
  const privateKey = `0x${key}` as Hex;
  try { privateKeyToAccount(privateKey); } catch { throw new Error('This claim key is invalid.'); }
  return { key: privateKey, id: BigInt(id), chainId, escrow: contract as Address };
}
