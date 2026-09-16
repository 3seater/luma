import { describe, it, expect } from 'vitest';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { recoverMessageAddress } from 'viem';
import { parseAmount, makeLink, parseLink, claimDigest } from './links';
const escrow = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
describe('Arc USDC amounts', () => {
  it('uses native 18 decimals without floating point rounding', () => {
    expect(parseAmount('1.000001')).toBe(1000001000000000000n);
    expect(parseAmount('0.000001')).toBe(1000000000000n);
  });
  it.each(['0','-1','1e3','1.0000001','1.','01','NaN','Infinity',' 1','1000000000000'])('rejects invalid amount %s', value => expect(() => parseAmount(value)).toThrow());
});
describe('Private claim links', () => {
  const key = generatePrivateKey();
  const link = makeLink('https://example.com', { key, id: 12n, chainId: 5042, escrow });
  const url = new URL(link);
  it('keeps all claim material in the fragment, out of HTTP paths and query strings', () => {
    expect(url.pathname).toBe('/claim'); expect(url.search).toBe('');
    expect(parseLink(url.hash, 5042, escrow)).toEqual({ key, id: 12n, chainId: 5042, escrow });
  });
  it('rejects network, contract, key, version, ID and duplicate-parameter errors', () => {
    for (const hash of [url.hash.replace('chain=5042','chain=1'),url.hash.replace(escrow,recipient),url.hash.replace('v=1','v=2'),url.hash.replace('id=12','id=0'),url.hash.replace(key.slice(2),'0'.repeat(64)),url.hash+'&id=13',url.hash.replace('id=12',`id=${2n**256n}`),'']) expect(() => parseLink(hash,5042,escrow)).toThrow();
  });
  it('binds signatures to chain, escrow, ID, and recipient', async () => {
    const account = privateKeyToAccount(key);
    const digest = claimDigest(5042, escrow, 12n, recipient);
    const signature = await account.signMessage({ message: { raw: digest } });
    expect(await recoverMessageAddress({ message: { raw: digest }, signature })).toBe(account.address);
    for (const other of [claimDigest(1,escrow,12n,recipient),claimDigest(5042,recipient,12n,recipient),claimDigest(5042,escrow,13n,recipient),claimDigest(5042,escrow,12n,escrow)]) {
      expect(await recoverMessageAddress({ message: { raw: other }, signature })).not.toBe(account.address);
    }
  });
});
