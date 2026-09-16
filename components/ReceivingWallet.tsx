'use client';
import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { usePublicClient, useBalance } from 'wagmi';
import { createWalletClient, custom, formatUnits, isAddress, zeroAddress, type Address, type Hash } from 'viem';
import { arc, transactionUrl } from '@/lib/arc';
import { arcFees, userError } from '@/lib/transactions';
import { parseAmount } from '@/lib/links';
import { useAuth } from './Auth';
import { UsdcCoin } from './Shell';
import { Copy, Check, RefreshCw, ArrowUpRight, KeyRound } from 'lucide-react';
export function ReceivingWallet({ address, defaultOpen = false }: { address: Address; defaultOpen?: boolean }) {
  const auth = useAuth();
  const { wallets } = useWallets();
  const wallet = wallets.find(item => item.address.toLowerCase() === address.toLowerCase());
  const client = usePublicClient({ chainId: arc.id });
  const balance = useBalance({ address, chainId: arc.id });
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hash, setHash] = useState<Hash>();
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  async function send() {
    if (!wallet || !client || busy) return;
    setBusy(true); setError(''); setHash(undefined); setConfirmed(false);
    try {
      if (!isAddress(destination) || destination === zeroAddress) throw new Error('Enter a valid Arc wallet address.');
      const value = parseAmount(amount);
      await wallet.switchChain(arc.id);
      const provider = await wallet.getEthereumProvider();
      const fees = await arcFees(client);
      const gas = await client.estimateGas({ account: address, to: destination, value }) * 120n / 100n;
      if (await client.getBalance({ address }) < value + gas * fees.maxFeePerGas) throw new Error('Leave enough USDC for the network fee.');
      const sender = createWalletClient({ account: address, chain: arc, transport: custom(provider) });
      const tx = await sender.sendTransaction({ to: destination, value, gas, ...fees });
      setHash(tx);
      const receipt = await client.waitForTransactionReceipt({ hash: tx, onReplaced: replacement => setHash(replacement.transaction.hash) });
      if (receipt.status !== 'success') throw new Error('The transfer did not complete.');
      setConfirmed(true); await balance.refetch();
    } catch (e) { setError(userError(e)); } finally { setBusy(false); }
  }
  const content = <div className="wallet-panel">
    <section className="wallet-balance-panel" aria-label="USDC balance">
      <div className="wallet-asset-heading"><UsdcCoin /><div><strong>USDC</strong><span>{arc.name}</span></div><button className="wallet-icon-button" aria-label="Refresh balance" title="Refresh balance" disabled={balance.isFetching} onClick={() => balance.refetch()}><RefreshCw size={17} /></button></div>
      <div className="wallet-balance-value" aria-live="polite">{balance.data ? <><span>{formatUnits(balance.data.value, 18)}</span><small>USDC</small></> : <small>{balance.isError ? 'Balance unavailable' : 'Loading balance…'}</small>}</div>
      <div className="wallet-address-row"><code title={address}>{address}</code><button className="wallet-icon-button" aria-label={copied ? 'Address copied' : 'Copy wallet address'} title="Copy address" onClick={async () => { try { await navigator.clipboard.writeText(address); setCopied(true); } catch { setError('Could not copy. Select the address above.'); } }}>{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
    </section>
    {wallet && <section className="wallet-transfer-panel" aria-labelledby="wallet-transfer-title">
      <h2 id="wallet-transfer-title">Send USDC</h2>
      <div className="wallet-form-field"><label htmlFor="withdraw-address">Recipient address</label><input className="standard" id="withdraw-address" autoComplete="off" spellCheck={false} value={destination} onChange={event => setDestination(event.target.value)} placeholder="0x…" /></div>
      <div className="wallet-form-field"><label htmlFor="withdraw-amount">Amount</label><div className="wallet-amount-input"><input id="withdraw-amount" inputMode="decimal" autoComplete="off" placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} /><span><UsdcCoin />USDC</span></div></div>
      <button className="button full" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send USDC'}<ArrowUpRight size={17} /></button>
      <p className="wallet-transfer-note">Arc addresses only. Leave USDC for the network fee.</p>
    </section>}
    {wallet && <div className="wallet-export-row"><button onClick={async () => { try { await auth.exportWallet(); } catch { setError('Could not open wallet export.'); } }}><KeyRound size={16} />Export wallet<ArrowUpRight size={15} /></button></div>}
    {confirmed && <p role="status">USDC sent.</p>}{hash && <a href={transactionUrl(hash)} target="_blank" rel="noreferrer" className="text-link">View transfer ↗</a>}{error && <p className="error" role="alert">{error}</p>}
  </div>;
  return defaultOpen ? content : <details className="receipt-wallet-details"><summary>Your wallet</summary>{content}</details>;
}
