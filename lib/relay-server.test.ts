import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { keccak256, parseEther } from 'viem';
import { claimDigest } from './links';

const mocks = vi.hoisted(() => ({
  getChainId: vi.fn(), getCode: vi.fn(), readContract: vi.fn(), getTransactionReceipt: vi.fn(),
  estimateFeesPerGas: vi.fn(), estimateContractGas: vi.fn(), getBalance: vi.fn(),
  getTransactionCount: vi.fn(), signTransaction: vi.fn(), sendRawTransaction: vi.fn(),
}));
vi.mock('viem', async original => ({ ...await original<typeof import('viem')>(), createPublicClient: () => mocks, createWalletClient: () => mocks }));
const escrow = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
const signer = privateKeyToAccount(generatePrivateKey());
const events: string[] = [];
let rows: unknown[] = [];
let save = true;
let pending: string | null = null;
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); events.length = 0; rows = []; save = true; pending = null;
  vi.stubEnv('NEXT_PUBLIC_ARC_ESCROW_ADDRESS', escrow);
  vi.stubEnv('NEXT_PUBLIC_ARC_NETWORK', 'mainnet');
  vi.stubEnv('RELAYER_PRIVATE_KEY', generatePrivateKey());
  vi.stubEnv('SUPABASE_URL', 'https://database.example');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-only');
  mocks.getChainId.mockResolvedValue(5042); mocks.getCode.mockResolvedValue('0x01');
  mocks.readContract.mockImplementation(async ({ functionName }) => functionName === 'VERSION' ? 'arc-send-1' : { status: 1, claimSigner: signer.address });
  mocks.estimateFeesPerGas.mockResolvedValue({ maxFeePerGas: 20000000000n, maxPriorityFeePerGas: 0n });
  mocks.estimateContractGas.mockResolvedValue(100000n); mocks.getBalance.mockResolvedValue(parseEther('10'));
  mocks.getTransactionCount.mockResolvedValue(7);
  mocks.signTransaction.mockImplementation(async () => { events.push('sign'); return '0x01'; });
  mocks.sendRawTransaction.mockImplementation(async () => { events.push('broadcast'); return keccak256('0x01'); });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.includes('luma_relay_acquire')) return Response.json(true);
    if (url.includes('luma_relay_jobs?')) return Response.json(rows);
    if (url.includes('luma_relay_state?')) return Response.json([{ active_hash: pending }]);
    if (url.includes('luma_relay_save')) { events.push('persist'); expect(JSON.parse(init!.body as string)).not.toHaveProperty('key'); return Response.json(save); }
    if (url.includes('luma_relay_release')) return Response.json(null);
    throw new Error('Unexpected request');
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
async function payload() {
  return { chainId: 5042, escrow, recipientAddress: recipient, depositId: '1', signature: await signer.signMessage({ message: { raw: claimDigest(5042, escrow, 1n, recipient) } }) } as const;
}
describe('Durable sponsored claims', () => {
  it('persists signed bytes before broadcasting and uses the relayer nonce', async () => {
    const { relayClaim } = await import('./relay-server');
    expect(await relayClaim(await payload(), 'user')).toBe(keccak256('0x01'));
    expect(events).toEqual(['sign', 'persist', 'broadcast']);
    expect(mocks.signTransaction.mock.calls[0][0].nonce).toBe(7);
  });
  it('does not broadcast if persistence, budget or the lease rejects the save', async () => {
    save = false;
    const { relayClaim } = await import('./relay-server');
    await expect(relayClaim(await payload(), 'user')).rejects.toThrow();
    expect(mocks.sendRawTransaction).not.toHaveBeenCalled();
  });
  it('rebroadcasts saved bytes on a retry without signing a second transaction', async () => {
    rows = [{ recipient: recipient.toLowerCase(), raw_tx: '0x02', tx_hash: keccak256('0x02') }];
    const { relayClaim } = await import('./relay-server');
    expect(await relayClaim(await payload(), 'user')).toBe(keccak256('0x02'));
    expect(mocks.signTransaction).not.toHaveBeenCalled();
    expect(mocks.sendRawTransaction).toHaveBeenCalledWith({ serializedTransaction: '0x02' });
  });
  it('blocks another nonce while the prior transaction is unresolved', async () => {
    pending = keccak256('0x03'); mocks.getTransactionReceipt.mockRejectedValue(new Error('not mined'));
    const { relayClaim } = await import('./relay-server');
    await expect(relayClaim(await payload(), 'user')).rejects.toThrow();
    expect(mocks.signTransaction).not.toHaveBeenCalled();
  });
  it('rejects a recipient substitution before spending any relay gas', async () => {
    const { relayClaim } = await import('./relay-server');
    await expect(relayClaim({ ...await payload(), recipientAddress: escrow }, 'user')).rejects.toThrow();
    expect(mocks.signTransaction).not.toHaveBeenCalled();
  });
});
