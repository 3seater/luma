import type { Address } from 'viem';
export async function backupLink(link: string, walletAddress: Address) {
  const response = await fetch('/api/beams', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, claimFragment: new URL(link).hash }) });
  if (!response.ok) throw new Error('Your link is ready, but its backup was not saved. Keep a copy and retry the backup.');
}
