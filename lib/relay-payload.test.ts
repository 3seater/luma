import { describe, it, expect } from 'vitest';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { recoverMessageAddress } from 'viem';
import { parseRelayPayload } from './relay-payload';
import { claimDigest } from './links';
const escrow = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
const payload = { chainId: 5042, escrow, depositId: '1', recipientAddress: recipient, signature: `0x${'ab'.repeat(65)}` };
describe('Sponsored claim boundary', () => {
  it('rejects wrong networks, contracts, invalid amounts and accidental private keys', () => {
    expect(parseRelayPayload(payload, 5042, escrow)).toEqual(payload);
    for (const patch of [{ key: 'secret' }, { claimFragment: '#key=secret' }, { chainId: 5042002 }, { escrow: recipient }, { depositId: '-1' }, { depositId: String(2n ** 256n) }, { recipientAddress: escrow }, { signature: '0x00' }]) {
      expect(() => parseRelayPayload({ ...payload, ...patch }, 5042, escrow)).toThrow();
    }
  });
  it('can relay a claim without the recipient holding funds and cannot redirect its signature', async () => {
    const signer = privateKeyToAccount(generatePrivateKey());
    const signature = await signer.signMessage({ message: { raw: claimDigest(5042, escrow, 1n, recipient) } });
    expect(await recoverMessageAddress({ message: { raw: claimDigest(5042, escrow, 1n, recipient) }, signature })).toBe(signer.address);
    expect(await recoverMessageAddress({ message: { raw: claimDigest(5042, escrow, 1n, escrow) }, signature })).not.toBe(signer.address);
    expect(JSON.stringify({ ...payload, signature })).not.toContain('key');
  });
});
