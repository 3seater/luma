import type { Address } from 'viem';
export function recoveryMessage(wallet: Address, origin: string, chainId: number, escrow: Address, timestamp: number) {
  return `Recover my Luma links\nOrigin: ${origin}\nChain: ${chainId}\nEscrow: ${escrow.toLowerCase()}\nWallet: ${wallet.toLowerCase()}\nTimestamp: ${timestamp}`;
}
export function validRecoveryTime(timestamp: number, now = Date.now()) {
  return Number.isSafeInteger(timestamp) && timestamp <= now + 30000 && timestamp >= now - 300000;
}
