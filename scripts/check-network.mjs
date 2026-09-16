import { createPublicClient, http, isAddress } from 'viem';
import fs from 'node:fs';
if (fs.existsSync('.env.local')) process.loadEnvFile('.env.local');
const testnet = process.env.NEXT_PUBLIC_ARC_NETWORK === 'testnet';
const expected = testnet ? 5042002 : 5042;
const url = process.env.NEXT_PUBLIC_ARC_RPC_URL || (testnet ? 'https://rpc.testnet.arc.io' : 'https://rpc.mainnet.arc.io');
const client = createPublicClient({ transport: http(url, { timeout: 15000, retryCount: 0 }) });
try {
  const chainId = await client.getChainId();
  if (chainId !== expected) throw new Error(`Expected chain ${expected}, received ${chainId}.`);
  const block = await client.getBlockNumber();
  console.log(`Verified chain ${chainId}, block ${block}.`);
  const address = process.env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS;
  if (address) {
    if (!isAddress(address)) throw new Error('Invalid escrow address.');
    const code = await client.getCode({ address });
    if (!code || code === '0x') throw new Error('Configured escrow has no deployed code.');
    console.log('Configured escrow has deployed code. Verify the source and deployment artifact before release.');
  } else console.log('Escrow not configured. Transactions remain disabled in the app.');
} catch (error) {
  console.error(error.shortMessage || error.message);
  process.exitCode = 1;
}
