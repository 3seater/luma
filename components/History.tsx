'use client';
import { useEffect, useState, useRef } from 'react';
import { useAccount, usePublicClient, useSwitchChain, useWriteContract, useSignMessage } from 'wagmi';
import { formatUnits } from 'viem';
import { arc, escrowAddress, escrowAbi, type Deposit, transactionUrl } from '@/lib/arc';
import { readHistory } from '@/lib/history';
import { verifyEscrow, userError, arcFees } from '@/lib/transactions';
import { Wallet } from './Wallet';
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
  return <main className="flow-page"><div className="flow-heading"><span className="eyebrow">EVERY LITTLE CONNECTION</span><h1>Your links.</h1><p>See what’s been claimed. Take back what hasn’t.</p></div><div className="flow-card history-wide">
    {!address ? <div className="center"><h2>Connect your sending wallet.</h2><p className="small">Your links are tied to the wallet that created them.</p><Wallet /></div> : <>
      <p className="small">Your saved links, on any device. Use the same sending wallet to recover a private link. Status is read from Arc.</p>
      <button className="button secondary full" disabled={!!busy || !escrowAddress} onClick={recover}>Recover my links</button>
      {Object.entries(links).filter(([id]) => items[id]?.status === 1).map(([id, link]) => <div key={id} className="history-item"><label className="field-label" htmlFor={`recovered-${id}`}>Private link #{id}</label><textarea id={`recovered-${id}`} className="link-output" readOnly value={link} rows={3} /><button className="button full" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(id); } catch { setError('Select and copy the link above.'); } }}>{copied === id ? 'Link copied' : 'Copy recovered link'}</button></div>)}
      {!escrowAddress && <p className="notice">The Arc escrow has not been configured yet.</p>}
      <div className="history-list">{ids.map(id => items[id] && <div className="history-item" key={id}><div className="detail-row"><span>LINK #{id}</span><strong>{['Unknown', 'Unclaimed', 'Claimed', 'Cancelled'][items[id].status]}</strong></div><h3>{formatUnits(items[id].amount, 18)} USDC</h3><p className="small">{new Date(Number(items[id].createdAt) * 1000).toLocaleDateString()}</p>{items[id].status === 1 && <button className="button secondary" disabled={!!busy} onClick={() => cancel(id)}>Cancel & recover USDC</button>}</div>)}</div>
      {ids.length === 0 && <p className="empty-state">No links saved in this browser yet.<br /><Link href="/send" className="text-link">Create your first link ↗</Link></p>}
      <label htmlFor="deposit-id" className="field-label">Recover a deposit from another browser</label><input id="deposit-id" className="standard" inputMode="numeric" value={lookup} onChange={e => setLookup(e.target.value)} placeholder="Deposit ID from your transaction receipt" /><button className="button secondary full" disabled={!!busy || !escrowAddress} onClick={findDeposit}>Look up deposit</button><button className="text-link" disabled={!!busy} onClick={() => { setError(''); setRefresh(value => value + 1); }}>Refresh statuses</button>
    </>}
    {busy && <p className="progress" role="status">{busy}</p>}{error && <p className="error" role="alert">{error}</p>}{lastTx && <div><a className="text-link" href={transactionUrl(lastTx)} target="_blank" rel="noreferrer">View transaction ↗</a></div>}
  </div></main>;
}
