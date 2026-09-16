import { NextRequest, NextResponse } from 'next/server';
import { arc, escrowAddress } from '@/lib/arc';
import { parseRelayPayload } from '@/lib/relay-payload';
import { relayClaim, relayConfigured, verifyRecipient } from '@/lib/relay-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() { return reply({ available: relayConfigured() }); }
export async function POST(request: NextRequest) {
  if (!relayConfigured()) return reply({ error: 'Sponsored claims are being set up. Please try again later.' }, 503);
  if (request.headers.get('origin') !== request.nextUrl.origin) return reply({ error: 'Invalid request origin.' }, 403);
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ') || authorization.length > 8192) return reply({ error: 'Please sign in again.' }, 401);
  let data;
  try {
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error();
    // Bound streamed input too; Content-Length alone is not trustworthy.
    const reader = request.body?.getReader();
    if (!reader) throw new Error();
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 2048) { await reader.cancel(); throw new Error(); } chunks.push(value); }
    data = parseRelayPayload(JSON.parse(Buffer.concat(chunks).toString('utf8')), arc.id, escrowAddress!);
  } catch { return reply({ error: 'Invalid claim request.' }, 400); }
  let subject;
  try { subject = await verifyRecipient(authorization.slice(7), data.recipientAddress); }
  catch { return reply({ error: 'Please sign in again to verify your receiving wallet.' }, 401); }
  try { return reply({ txHash: await relayClaim(data, subject) }); }
  // Never log or expose SDK/RPC errors, auth headers, signatures or request bodies.
  catch { return reply({ error: 'The claim could not be submitted. Refresh its status and try again shortly.' }, 503); }
}
