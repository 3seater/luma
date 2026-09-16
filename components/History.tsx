'use client';
import { useEffect, useState, useRef } from 'react';
import { useAccount, usePublicClient, useSwitchChain, useWriteContract, useSignMessage } from 'wagmi';
import { formatUnits } from 'viem';
import { arc, escrowAddress, escrowAbi, type Deposit, transactionUrl } from '@/lib/arc';
import { readHistory } from '@/lib/history';
import { verifyEscrow, userError, arcFees } from '@/lib/transactions';
import { Wallet } from './Wallet';
import { UsdcCoin } from './Shell';
import { Check, ChevronDown, Clock, Copy, ExternalLink, RefreshCw, Search, Wallet as WalletIcon, X } from 'lucide-react';
import Link from 'next/link';
import { recoveryMessage } from '@/lib/backup-auth';
import { parseLink } from '@/lib/links';
export function History() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: arc.id });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const [links, setLinks] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState('');
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<Record<string, Deposit>>({});
  const [lookup, setLookup] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [lastTx, setLastTx] = useState('');
  const lock = useRef(false);
  const activeAddress = useRef(address); activeAddress.current = address;
  useEffect(() => {
    setIds(address ? readHistory(address).map(item => item.id) : []); setItems({}); setLinks({}); setCopied(''); setError(''); setLastTx('');
    if (!address || !escrowAddress) return;
    let active = true;
    fetch(`/api/beams?wallet=${address}`, { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error('Could not load your saved links. Please try again.');
      const data = await response.json();
      if (active) setIds(previous => [...new Set([...data.entries.map((entry: { depositId: string }) => entry.depositId), ...previous])]);
    }).catch(e => { if (active) setError(userError(e)); });
    return () => { active = false; };
  }, [address, refresh]);
  async function recover() {
    if (!address || !escrowAddress || lock.current) return;
    const sender = address;
    lock.current = true; setError(''); setBusy('Confirm recovery with your sending wallet…');
    try {
      const timestamp = Date.now();
      const signature = await signMessageAsync({ account: sender, message: recoveryMessage(sender, window.location.origin, arc.id, escrowAddress, timestamp) });
      const response = await fetch(`/api/beams?wallet=${sender}`, { headers: { 'x-luma-signature': signature, 'x-luma-timestamp': String(timestamp) }, cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not recover your links.');
      if (activeAddress.current !== sender) return;
      const recovered: Record<string, string> = {};
      for (const entry of data.entries) {
        const parsed = parseLink(entry.claimFragment, arc.id, escrowAddress);
        if (String(parsed.id) !== entry.depositId || entry.walletAddress.toLowerCase() !== sender.toLowerCase()) throw new Error('Backup did not match your wallet.');
        recovered[entry.depositId] = `${window.location.origin}/claim${entry.claimFragment}`;
      }
      setLinks(recovered); setIds(previous => [...new Set([...Object.keys(recovered), ...previous])]);
    } catch (e) { setError(userError(e)); } finally { lock.current = false; setBusy(''); }
  }
  useEffect(() => {
    let active = true;
    if (!client || !escrowAddress || !address || ids.length === 0) return;
    setBusy('Loading your deposits…');
    Promise.all(ids.map(async id => [id, await client.readContract({ address: escrowAddress!, abi: escrowAbi, functionName: 'getDeposit', args: [BigInt(id)] })] as const))
      .then(entries => { if (active) setItems(Object.fromEntries(entries.filter(([, item]) => item.sender.toLowerCase() === address.toLowerCase()))); })
      .catch(e => { if (active) setError(userError(e)); })
      .finally(() => { if (active) setBusy(''); });
    return () => { active = false; };
  }, [ids, address, client, refresh]);
  async function findDeposit() {
    if (!address || !client || !escrowAddress || lock.current) return;
    lock.current = true; setError('');
    try {
      if (!/^[1-9]\d{0,77}$/.test(lookup) || BigInt(lookup) >= 2n ** 256n) throw new Error('Enter a valid deposit ID.');
      setBusy('Finding your deposit…');
      await verifyEscrow(client, escrowAddress);
      const item = await client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: 'getDeposit', args: [BigInt(lookup)] });
      if (item.status === 0) throw new Error('No deposit exists with this ID.');
      if (item.sender.toLowerCase() !== address.toLowerCase()) throw new Error('Connect the wallet that sent this deposit.');
      setItems(previous => ({ ...previous, [lookup]: item })); setIds(previous => [...new Set([lookup, ...previous])]);
    } catch (e) { setError(userError(e)); } finally { setBusy(''); lock.current = false; }
  }
  async function cancel(id: string) {
    if (!address || !client || !escrowAddress || lock.current) return;
    lock.current = true; setError('');
    try {
      setBusy('Preparing your cancellation…');
      await verifyEscrow(client, escrowAddress);
      if (chainId !== arc.id) await switchChainAsync({ chainId: arc.id });
      const { request } = await client.simulateContract({ address: escrowAddress, abi: escrowAbi, functionName: 'cancel', args: [BigInt(id)], account: address, ...await arcFees(client) });
      setBusy('Confirm cancellation in your wallet…');
      const hash = await writeContractAsync({ ...request, chainId: arc.id });
      setLastTx(hash); setBusy('Waiting for cancellation to confirm…');
      const receipt = await client.waitForTransactionReceipt({ hash, timeout: 120000, onReplaced: replacement => setLastTx(replacement.transaction.hash) });
      if (receipt.status !== 'success') throw new Error('Cancellation reverted. The link may already have been claimed.');
      setRefresh(value => value + 1);
    } catch (e) { setError(userError(e)); } finally { setBusy(''); lock.current = false; }
  }
  return <main className="flow-page lumas-page"><div className="lumas-wrap">
    <header className="lumas-heading"><Clock size={24} aria-hidden="true" /><h1>Your Lumas</h1></header>
    {!address ? <div className="lumas-panel lumas-connect"><span className="lumas-wallet-icon"><WalletIcon size={28} aria-hidden="true" /></span><div><h2>Connect your wallet</h2><p>Connect to see the Lumas you&apos;ve sent.</p></div><Wallet /></div> : <div className="lumas-panel">
      <div className="lumas-toolbar" role="group" aria-label="Luma history actions">
        <button disabled={!!busy || !escrowAddress} onClick={recover}><Copy size={15} />Restore my links</button>
        <button disabled={!!busy} onClick={() => { setError(''); setRefresh(value => value + 1); }}><RefreshCw size={15} />Refresh</button>
      </div>
      {!escrowAddress && <p className="notice">The Arc escrow has not been configured yet.</p>}
      <div className="lumas-list">{ids.map(id => {
        const item = items[id];
        if (!item) return null;
        const amount = formatUnits(item.amount, 18);
        const date = new Date(Number(item.createdAt) * 1000);
        const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
        const age = minutes < 1 ? 'just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;
        return <div className="luma-row" key={id}>
          <div className="luma-info"><UsdcCoin /><span className={`luma-amount${item.status === 3 ? ' cancelled' : ''}`} title={`${amount} USDC`}>{amount} USDC</span><span className="luma-usd">${amount}</span>
            <span className="luma-actions">{item.status === 1 && links[id] && <>
              <button aria-label={copied === id ? `Copied Luma ${id} link` : `Copy Luma ${id} link`} title="Copy link" onClick={async () => { try { await navigator.clipboard.writeText(links[id]); setCopied(id); } catch { setError('Could not copy your link. Please try again.'); } }}>{copied === id ? <Check size={10} /> : <Copy size={10} />}</button>
              <a href={links[id]} target="_blank" rel="noopener noreferrer" aria-label={`Open Luma ${id} claim page`} title="Open claim page"><ExternalLink size={10} /></a>
            </>}</span>
          </div>
          <div className="luma-meta"><span className="luma-status-slot"><span className={`luma-status status-${item.status}`}>{item.status === 2 && <Check size={9} />}{['Unavailable', 'Pending', 'Claimed', 'Cancelled'][item.status]}</span></span><span className="luma-cancel">{item.status === 1 && <button disabled={!!busy} onClick={() => cancel(id)} aria-label={`Cancel Luma ${id} and recover USDC`} title="Cancel and recover USDC"><X size={10} /></button>}</span><time dateTime={date.toISOString()} title={date.toLocaleString()}>{age}</time></div>
        </div>;
      })}</div>
      {ids.length === 0 && !busy && <p className="lumas-empty">No saved Lumas found. <Link href="/send">Send your first Luma ↗</Link></p>}
      <details className="lumas-recovery">
        <summary><span>Missing a Luma?</span><ChevronDown size={15} aria-hidden="true" /></summary>
        <div className="lumas-recovery-body">
          <p>Restore your links with the same sending wallet, or find a deposit using the ID on your receipt.</p>
          <label htmlFor="deposit-id">Deposit ID</label>
          <div className="lumas-lookup"><input id="deposit-id" inputMode="numeric" value={lookup} onChange={e => setLookup(e.target.value)} placeholder="Enter deposit ID" /><button disabled={!!busy || !escrowAddress} onClick={findDeposit}><Search size={14} aria-hidden="true" />Look up</button></div>
        </div>
      </details>
    </div>}
    {busy && <p className="progress" role="status">{busy}</p>}{error && <p className="error" role="alert">{error}</p>}{lastTx && <div><a className="text-link" href={transactionUrl(lastTx)} target="_blank" rel="noreferrer">View transaction ↗</a></div>}
  </div></main>;
}
