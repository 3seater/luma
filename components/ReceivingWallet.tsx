'use client';
import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { usePublicClient, useBalance } from 'wagmi';
import { createWalletClient, custom, formatUnits, isAddress, zeroAddress, type Address, type Hash } from 'viem';
import { arc, transactionUrl } from '@/lib/arc';
import { arcFees, userError } from '@/lib/transactions';
import { parseAmount } from '@/lib/links';
import { useAuth } from './Auth';
export function ReceivingWallet({ address }: { address: Address }) {
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
  return <details className="receipt-wallet-details"><summary>Your wallet & next steps</summary><div className="receipt-wallet-content">
    <p className="small">Your wallet on {arc.name}</p><p className="small" style={{ overflowWrap: 'anywhere' }}>{address}</p>
    <button className="button secondary" onClick={async () => { try { await navigator.clipboard.writeText(address); setCopied(true); } catch { setError('Could not copy. Select the address above.'); } }}>{copied ? 'Copied' : 'Copy address'}</button>
    <p>{balance.data ? `${formatUnits(balance.data.value, 18)} USDC` : 'Loading balance…'}</p>
    {wallet && <><label className="field-label" htmlFor="withdraw-address">Send to a wallet on Arc</label><input className="standard" id="withdraw-address" value={destination} onChange={event => setDestination(event.target.value)} placeholder="0x…" /><label className="field-label" htmlFor="withdraw-amount">Amount in USDC</label><input className="standard" id="withdraw-amount" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} /><button className="button full" disabled={busy} onClick={send}>{busy ? 'Sending…' : 'Send to wallet'}</button><p className="small">Use an address that accepts USDC on Arc. Network fees apply to this transfer.</p><button className="button secondary full" onClick={async () => { try { await auth.exportWallet(); } catch { setError('Could not open wallet export.'); } }}>Use in another wallet</button></>}
    {confirmed && <p role="status">USDC sent.</p>}{hash && <a href={transactionUrl(hash)} target="_blank" rel="noreferrer" className="text-link">View transfer ↗</a>}{error && <p className="error" role="alert">{error}</p>}
  </div></details>;
}
