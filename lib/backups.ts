import { arc, escrowAddress } from './arc';
import { encryptBackup, decryptBackup } from './beam-backup-crypto';
import type { Address } from 'viem';
export type Backup = { depositId: string; walletAddress: Address; claimFragment: string; amount: string; createdAt: number };
type Row = { scope: string; deposit_id: string; wallet_address: Address; encrypted_entry: string; created_at: number };
const scope = () => `${arc.id}:${escrowAddress!.toLowerCase()}`;
const identity = (row: Pick<Row, 'scope' | 'deposit_id' | 'wallet_address'>) => `${row.scope}:${row.deposit_id}:${row.wallet_address}`;
export function backupsConfigured() { return !!(escrowAddress && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && /^[0-9a-fA-F]{64}$/.test(process.env.BEAM_BACKUP_ENCRYPTION_KEY || '')); }
async function request(params: URLSearchParams, init: RequestInit = {}): Promise<Row[]> {
  if (!backupsConfigured()) throw new Error('Link backups are not configured.');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const url = new URL('/rest/v1/beam_link_backups', process.env.SUPABASE_URL!);
  if (url.protocol !== 'https:') throw new Error('Backups require HTTPS.');
  url.search = params.toString();
  const response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers } });
  if (!response.ok) throw new Error('Link backup storage is unavailable.');
  return response.json();
}
function decode(row: Row) {
  const entry = decryptBackup<Backup>(row.encrypted_entry, identity(row));
  if (entry.depositId !== row.deposit_id || entry.walletAddress !== row.wallet_address || row.scope !== scope()) throw new Error('Backup identity mismatch.');
  return entry;
}
export async function saveBackup(entry: Backup) {
  const normalized = { ...entry, walletAddress: entry.walletAddress.toLowerCase() as Address };
  const row = { scope: scope(), deposit_id: entry.depositId, wallet_address: normalized.walletAddress, created_at: entry.createdAt };
  const inserted = await request(new URLSearchParams({ on_conflict: 'scope,deposit_id' }), { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ ...row, encrypted_entry: encryptBackup(normalized, identity(row)) }) });
  if (inserted.length) return;
  const existing = await request(new URLSearchParams({ scope: `eq.${row.scope}`, deposit_id: `eq.${row.deposit_id}`, select: '*' }));
  const saved = existing[0] && decode(existing[0]);
  if (!saved || saved.walletAddress !== normalized.walletAddress || saved.claimFragment !== entry.claimFragment) throw new Error('A different backup already exists.');
}
export async function getBackups(wallet: Address) {
  const entries: Backup[] = [];
  for (let offset = 0; ; offset += 500) {
    const rows = await request(new URLSearchParams({ scope: `eq.${scope()}`, wallet_address: `eq.${wallet.toLowerCase()}`, select: '*', order: 'created_at.desc,deposit_id.asc', limit: '500', offset: String(offset) }));
    entries.push(...rows.map(decode));
    if (rows.length < 500) return entries;
  }
}
