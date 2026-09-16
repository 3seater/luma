import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, formatUnits, http, isAddress, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arc, escrowAbi, escrowAddress } from '@/lib/arc';
import { parseLink } from '@/lib/links';
import { backupsConfigured, getBackups, saveBackup } from '@/lib/backups';
import { recoveryMessage, validRecoveryTime } from '@/lib/backup-auth';
import { verifyEscrow } from '@/lib/transactions';
import { requestOrigin } from '@/lib/request-origin';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const rpc = () => createPublicClient({ chain: arc, transport: http(process.env.ARC_RPC_URL || arc.rpcUrls.default.http[0]) });
const origin = (request: NextRequest) => requestOrigin(request.nextUrl.origin, request.headers.get('host'), process.env.NODE_ENV === 'development');
export async function GET(request: NextRequest) {
  if (!backupsConfigured()) return reply({ error: 'Link backups are being set up.' }, 503);
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet || !isAddress(wallet)) return reply({ error: 'Invalid wallet.' }, 400);
  const signature = request.headers.get('x-luma-signature');
  if (signature) {
    const timestamp = Number(request.headers.get('x-luma-timestamp'));
    if (!validRecoveryTime(timestamp) || signature.length > 8192 || !/^0x[0-9a-fA-F]+$/.test(signature)) return reply({ error: 'Please sign again to recover your links.' }, 401);
    try {
      const valid = await rpc().verifyMessage({ address: wallet, message: recoveryMessage(wallet, origin(request), arc.id, escrowAddress!, timestamp), signature: signature as Hex });
      if (!valid) return reply({ error: 'Please use the original sending wallet.' }, 401);
    } catch { return reply({ error: 'Could not verify your sending wallet.' }, 503); }
  }
  try {
    const entries = await getBackups(wallet);
    // Public history never includes a secret. Recovery requires a wallet signature.
    return reply({ entries: signature ? entries : entries.map(({ depositId, walletAddress, amount, createdAt }) => ({ depositId, walletAddress, amount, createdAt })) });
  } catch { return reply({ error: 'Link backup storage is temporarily unavailable.' }, 503); }
}
export async function POST(request: NextRequest) {
  if (!backupsConfigured()) return reply({ error: 'Link backups are being set up.' }, 503);
  if (request.headers.get('origin') !== origin(request)) return reply({ error: 'Invalid origin.' }, 403);
  try {
    const reader = request.body?.getReader(); if (!reader) throw new Error();
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; length += value.length; if (length > 2048) { await reader.cancel(); throw new Error(); } chunks.push(value); }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (Object.keys(body).length !== 2 || typeof body.claimFragment !== 'string' || !isAddress(body.walletAddress)) throw new Error();
    const link = parseLink(body.claimFragment, arc.id, escrowAddress!);
    const client = rpc();
    await verifyEscrow(client, escrowAddress!);
    const deposit = await client.readContract({ address: escrowAddress!, abi: escrowAbi, functionName: 'getDeposit', args: [link.id] });
    if (deposit.status === 0 || deposit.sender.toLowerCase() !== body.walletAddress.toLowerCase() || deposit.claimSigner.toLowerCase() !== privateKeyToAccount(link.key).address.toLowerCase()) return reply({ error: 'This link does not match your deposit.' }, 403);
    await saveBackup({ depositId: String(link.id), walletAddress: deposit.sender as Address, claimFragment: body.claimFragment, amount: formatUnits(deposit.amount, 18), createdAt: Number(deposit.createdAt) * 1000 });
    return reply({ ok: true });
  } catch { return reply({ error: 'Could not save your backup. Keep the link and retry.' }, 503); }
}
