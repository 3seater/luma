import { createHash, randomUUID } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createPublicClient, createWalletClient, encodeFunctionData, http, keccak256, parseUnits, recoverMessageAddress, type Address, type Hash, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arc, escrowAbi, escrowAddress } from './arc';
import { claimDigest } from './links';
import { arcFees, verifyEscrow } from './transactions';
import type { RelayPayload } from './relay-payload';

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error('Sponsored claims are not configured.');
  return value;
}
export function relayConfigured() {
  return !!escrowAddress && ['NEXT_PUBLIC_PRIVY_APP_ID', 'PRIVY_APP_SECRET', 'RELAYER_PRIVATE_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].every(name => !!process.env[name]);
}
let verificationKeys: ReturnType<typeof createRemoteJWKSet> | undefined;
export async function verifyRecipient(token: string, recipient: Address) {
  const appId = required('NEXT_PUBLIC_PRIVY_APP_ID');
  verificationKeys ??= createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${encodeURIComponent(appId)}/jwks.json`));
  const { payload } = await jwtVerify(token, verificationKeys, { issuer: 'privy.io', audience: appId, algorithms: ['ES256'], requiredClaims: ['sub', 'exp', 'iat'] });
  if (!payload.sub?.startsWith('did:privy:')) throw new Error('Invalid session.');
  const response = await fetch(`https://api.privy.io/v1/users/${encodeURIComponent(payload.sub)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${appId}:${required('PRIVY_APP_SECRET')}`).toString('base64')}`, 'privy-app-id': appId },
    cache: 'no-store', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Could not verify your wallet.');
  const user = await response.json() as { id: string; linked_accounts: { type: string; wallet_client_type?: string; chain_type?: string; address?: string }[] };
  if (user.id !== payload.sub || !user.linked_accounts.some(account => account.type === 'wallet' && account.wallet_client_type === 'privy' && account.chain_type === 'ethereum' && account.address?.toLowerCase() === recipient.toLowerCase())) throw new Error('Claim recipient must be your embedded wallet.');
  return createHash('sha256').update(`${appId}:${payload.sub}`).digest('hex');
}

async function database<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${required('SUPABASE_URL').replace(/\/$/, '')}/rest/v1/${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { apikey: required('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${required('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: 'no-store', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Claim service is temporarily unavailable.');
  return response.json() as Promise<T>;
}
type Job = { deposit_id: string; recipient: string; raw_tx: Hex; tx_hash: Hash };
export async function relayClaim(data: RelayPayload, subject: string): Promise<Hash> {
  const account = privateKeyToAccount(required('RELAYER_PRIVATE_KEY') as Hex);
  const transport = http(process.env.ARC_RPC_URL || arc.rpcUrls.default.http[0], { timeout: 10000, retryCount: 0 });
  const client = createPublicClient({ chain: arc, transport });
  const wallet = createWalletClient({ chain: arc, transport, account });
  const scope = `${arc.id}:${account.address.toLowerCase()}`;
  const lease = randomUUID();
  const acquired = await database<boolean>('rpc/luma_relay_acquire', { p_scope: scope, p_token: lease, p_subject: subject });
  if (!acquired) throw new Error('Claims are busy. Please try again shortly.');
  try {
    await verifyEscrow(client, escrowAddress!);
    const jobs = await database<Job[]>(`luma_relay_jobs?scope=eq.${encodeURIComponent(scope)}&escrow=eq.${data.escrow.toLowerCase()}&deposit_id=eq.${data.depositId}&select=deposit_id,recipient,raw_tx,tx_hash`);
    if (jobs[0]) {
      if (jobs[0].recipient !== data.recipientAddress.toLowerCase()) throw new Error('This claim is already assigned to another recipient.');
      // Safe retry: the persisted bytes always have the same nonce, payout and hash.
      await client.sendRawTransaction({ serializedTransaction: jobs[0].raw_tx }).catch(() => undefined);
      return jobs[0].tx_hash;
    }
    const [state] = await database<{ active_hash: Hash | null }[]>(`luma_relay_state?scope=eq.${encodeURIComponent(scope)}&select=active_hash`);
    if (state?.active_hash) {
      // One pending nonce per funded relayer, across all server instances.
      try { await client.getTransactionReceipt({ hash: state.active_hash }); }
      catch { throw new Error('A claim is confirming. Please try again shortly.'); }
    }
    const deposit = await client.readContract({ address: data.escrow, abi: escrowAbi, functionName: 'getDeposit', args: [BigInt(data.depositId)] });
    if (deposit.status !== 1) throw new Error('This link is no longer available to claim.');
    const signer = await recoverMessageAddress({ message: { raw: claimDigest(arc.id, data.escrow, BigInt(data.depositId), data.recipientAddress) }, signature: data.signature });
    if (signer.toLowerCase() !== deposit.claimSigner.toLowerCase()) throw new Error('Invalid claim signature.');
    const args = [BigInt(data.depositId), data.recipientAddress, data.signature] as const;
    const fees = await arcFees(client);
    const gas = await client.estimateContractGas({ address: data.escrow, abi: escrowAbi, functionName: 'claim', args, account }) * 120n / 100n;
    const maxCost = gas * fees.maxFeePerGas;
    const maxClaim = parseUnits(process.env.RELAYER_MAX_CLAIM_FEE_USDC || '0.1', 18);
    const dailyBudget = parseUnits(process.env.RELAYER_DAILY_BUDGET_USDC || '10', 18);
    if (maxCost > maxClaim || maxCost <= 0n || maxClaim <= 0n || dailyBudget <= 0n) throw new Error('Claim fees are above the sponsored limit. Please try again later.');
    if (await client.getBalance({ address: account.address }) < maxCost) throw new Error('Sponsored claims are temporarily unavailable.');
    const nonce = await client.getTransactionCount({ address: account.address, blockTag: 'pending' });
    const raw = await wallet.signTransaction({ to: data.escrow, data: encodeFunctionData({ abi: escrowAbi, functionName: 'claim', args }), value: 0n, gas, ...fees, nonce });
    const hash = keccak256(raw);
    // Persist BEFORE broadcasting. Expired workers cannot save or broadcast new bytes.
    const saved = await database<boolean>('rpc/luma_relay_save', { p_scope: scope, p_token: lease, p_subject: subject, p_escrow: data.escrow.toLowerCase(), p_id: data.depositId, p_recipient: data.recipientAddress.toLowerCase(), p_raw: raw, p_hash: hash, p_cost: String(maxCost), p_budget: String(dailyBudget) });
    if (!saved) throw new Error('Sponsored claim limit reached. Please try again later.');
    // If the RPC times out after acceptance, the client can still track this hash.
    await client.sendRawTransaction({ serializedTransaction: raw }).catch(() => undefined);
    return hash;
  } finally {
    await database('rpc/luma_relay_release', { p_scope: scope, p_token: lease }).catch(() => undefined);
  }
}
