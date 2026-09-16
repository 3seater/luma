import { describe, expect, it, vi, afterEach } from 'vitest';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { verifyMessage } from 'viem';
import { recoveryMessage, validRecoveryTime } from './backup-auth';
import { encryptBackup, decryptBackup } from './beam-backup-crypto';
const wallet = privateKeyToAccount(generatePrivateKey());
const escrow = '0x1111111111111111111111111111111111111111';
afterEach(() => vi.unstubAllEnvs());
describe('Cross-device backup authorization', () => {
  it('binds the sending wallet, site, chain, escrow and timestamp', async () => {
    const time = Date.now();
    const message = recoveryMessage(wallet.address, 'https://luma.example', 5042, escrow, time);
    const signature = await wallet.signMessage({ message });
    expect(await verifyMessage({ address: wallet.address, message, signature })).toBe(true);
    for (const changed of [
      recoveryMessage(wallet.address, 'https://other.example', 5042, escrow, time),
      recoveryMessage(wallet.address, 'https://luma.example', 5042002, escrow, time),
      recoveryMessage(wallet.address, 'https://luma.example', 5042, wallet.address, time),
      recoveryMessage(wallet.address, 'https://luma.example', 5042, escrow, time + 1),
    ]) expect(await verifyMessage({ address: wallet.address, message: changed, signature })).toBe(false);
    expect(await verifyMessage({ address: privateKeyToAccount(generatePrivateKey()).address, message, signature })).toBe(false);
  });
  it('rejects old, far-future and malformed timestamps', () => {
    expect(validRecoveryTime(1000000, 1000000)).toBe(true);
    for (const time of [699999, 1030001, NaN, 1.5]) expect(validRecoveryTime(time, 1000000)).toBe(false);
  });
  it('encrypts backups and rejects a different wallet/deposit or altered ciphertext', () => {
    vi.stubEnv('BEAM_BACKUP_ENCRYPTION_KEY', 'a'.repeat(64));
    const payload = { claimFragment: '#key=very-private', depositId: '1' };
    const sealed = encryptBackup(payload, 'chain:escrow:1:wallet');
    expect(sealed).not.toContain('very-private');
    expect(decryptBackup(sealed, 'chain:escrow:1:wallet')).toEqual(payload);
    expect(() => decryptBackup(sealed, 'chain:escrow:2:wallet')).toThrow();
    expect(() => decryptBackup(sealed, 'chain:escrow:1:other')).toThrow();
    const parts = sealed.split('.'); parts[2] = Buffer.alloc(16).toString('base64');
    expect(() => decryptBackup(parts.join('.'), 'chain:escrow:1:wallet')).toThrow();
  });
});
