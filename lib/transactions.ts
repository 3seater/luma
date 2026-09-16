import { type PublicClient, type Address } from 'viem';
import { arc, escrowAbi } from './arc';
export async function arcFees(client: PublicClient) {
  const fees = await client.estimateFeesPerGas();
  return {
    maxFeePerGas: (fees.maxFeePerGas ?? 0n) < 20_000_000_000n ? 20_000_000_000n : fees.maxFeePerGas!,
    maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? 0n,
  };
}
export async function verifyEscrow(client: PublicClient, address: Address) {
  if (await client.getChainId() !== arc.id) throw new Error('The RPC returned a different network. No transaction was sent.');
  const code = await client.getCode({ address });
  if (!code || code === '0x') throw new Error('No escrow contract exists at the configured address.');
  const version = await client.readContract({ address, abi: escrowAbi, functionName: 'VERSION' });
  if (version !== 'arc-send-1') throw new Error('The configured contract is not an Arc Send escrow.');
}
export function userError(error: unknown) {
  const value = error as { shortMessage?: string; message?: string };
  return (value.shortMessage || value.message || 'Something went wrong. Please try again.').split('Request body:')[0].slice(0, 240);
}
