'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePublicClient } from 'wagmi';
import { formatUnits, parseEventLogs, type Hash, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ArrowUpRight } from 'lucide-react';
import { arc, escrowAddress, escrowAbi, shortAddress, transactionUrl, type Deposit } from '@/lib/arc';
import { claimDigest, parseLink, type ClaimLink } from '@/lib/links';
import { userError, verifyEscrow } from '@/lib/transactions';
import { useAuth } from './Auth';
import dynamic from 'next/dynamic';
import { UsdcCoin } from './Shell';
import { GiftCard } from './GiftCard';
import { captureClaimFragment, readClaimFragment, clearClaimFragment } from '@/lib/claim-session';
const ReceivingWallet = dynamic(() => import('./ReceivingWallet').then(module => module.ReceivingWallet), { ssr: false });
export function Claim() {
  const client = usePublicClient({ chainId: arc.id });
  const auth = useAuth();
  const [recipient, setRecipient] = useState<Address>();
  const [continueAfterLogin, setContinueAfterLogin] = useState(false);
  const [relayAvailable, setRelayAvailable] = useState<boolean>();
  const [linkInput, setLinkInput] = useState('');
  const [link, setLink] = useState<ClaimLink>();
  const [deposit, setDeposit] = useState<Deposit>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [tx, setTx] = useState<Hash>();
  const [done, setDone] = useState(false);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    fetch('/api/relay/claim', { cache: 'no-store' }).then(response => response.json()).then(data => setRelayAvailable(data.available === true)).catch(() => setRelayAvailable(false));
  }, []);
  useEffect(() => {
    const update = () => { captureClaimFragment(); setRevision(value => value + 1); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    if (!client) return;
    let active = true;
    setError(''); setDeposit(undefined); setLink(undefined); setDone(false); setTx(undefined);
    if (!escrowAddress) { setError('Claims are not live yet. The Arc escrow has not been configured.'); return; }
    setBusy('Checking your link on Arc…');
    async function load() {
      try {
        captureClaimFragment();
        const parsed = parseLink(readClaimFragment(), arc.id, escrowAddress!);
        await verifyEscrow(client!, escrowAddress!);
        const item = await client!.readContract({ address: escrowAddress!, abi: escrowAbi, functionName: 'getDeposit', args: [parsed.id] });
        if (item.status === 0) throw new Error('This deposit does not exist. Check the full link with the sender.');
        if (privateKeyToAccount(parsed.key).address.toLowerCase() !== item.claimSigner.toLowerCase()) throw new Error('This link cannot unlock the deposit. Ask the sender for the complete link.');
        if (active) { setLink(parsed); setDeposit(item); }
      } catch (e) { if (active) setError(userError(e)); } finally { if (active) setBusy(''); }
    }
    load();
    return () => { active = false; };
  }, [client, revision]);
  async function claim() {
    if (lock.current || !client || !link || !escrowAddress) return;
    if (!auth.authenticated) { if (await auth.requestLogin()) setContinueAfterLogin(true); return; }
    lock.current = true; setError('');
    try {
      setBusy('Preparing your wallet…');
      const address = await auth.ensureWallet();
      setRecipient(address);
      await verifyEscrow(client, escrowAddress);
      const signature = await privateKeyToAccount(link.key).signMessage({ message: { raw: claimDigest(arc.id, escrowAddress, link.id, address) } });
      setBusy('Claiming your USDC…');
      const token = await auth.getAccessToken();
      if (!token) throw new Error('Please sign in again.');
      const response = await fetch('/api/relay/claim', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chainId: arc.id, escrow: escrowAddress, depositId: String(link.id), recipientAddress: address, signature }) });
      const result = await response.json();
      if (!response.ok || !/^0x[0-9a-fA-F]{64}$/.test(result.txHash)) throw new Error(result.error || 'Could not submit your claim. Please try again.');
      const hash = result.txHash as Hash;
      setTx(hash); setBusy('Waiting for confirmation…');
      const receipt = await client.waitForTransactionReceipt({ hash, timeout: 120000, onReplaced: replacement => setTx(replacement.transaction.hash) });
      if (receipt.status !== 'success') throw new Error('The claim reverted. Refresh the deposit status before trying again.');
      const paid = parseEventLogs({ abi: escrowAbi, logs: receipt.logs, eventName: 'Claimed' }).some(event => event.address.toLowerCase() === escrowAddress!.toLowerCase() && event.args.id === link.id && event.args.recipient.toLowerCase() === address.toLowerCase());
      if (!paid) throw new Error('This transaction did not pay the expected claim. Refresh the deposit status.');
      const item = await client.readContract({ address: escrowAddress, abi: escrowAbi, functionName: 'getDeposit', args: [link.id] });
      setDeposit(item);
      if (item.status !== 2) throw new Error('The transaction did not complete the claim. Refresh the status.');
      setDone(true); setLink(undefined); clearClaimFragment(); window.history.replaceState(null, '', '/claim');
    } catch (e) { setError(userError(e)); } finally { setBusy(''); lock.current = false; }
  }
  useEffect(() => {
    if (continueAfterLogin && auth.authenticated && auth.ready && link && !lock.current) {
      setContinueAfterLogin(false);
      void claim();
    }
    // Consume the explicit claim intent after sign-in, never simply on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continueAfterLogin, auth.authenticated, auth.ready, link]);
  const closed = deposit && deposit.status !== 1;
  return <main className="flow-page"><div className="receipt-moment"><h1>{done ? 'Your Luma is claimed' : 'Claim your Luma'}</h1></div><div className="flow-card center">
    {deposit ? <><GiftCard amount={formatUnits(deposit.amount, 18)} label="A Luma for you" status={deposit.status === 2 ? 'Claimed' : deposit.status === 3 ? 'Cancelled' : 'Ready to receive'} /><p className="small">From {shortAddress(deposit.sender)} · {arc.name}</p></> : <UsdcCoin />}
    {done ? <><h2>USDC claimed.</h2><p className="small">The claim has been confirmed on Arc.</p><Link href="/send" className="button full">Send some good along <ArrowUpRight size={16} /></Link></> : closed ? <p className="notice">{deposit.status === 2 ? 'This link has already been claimed.' : 'The sender cancelled this link and recovered the USDC.'}</p> : deposit && link ? <>
      <p className="notice">Open your link, sign in, and claim. No existing wallet or gas balance needed.</p>
      <button className="button full" disabled={!!busy || !auth.ready || !auth.configured || relayAvailable !== true} onClick={claim}>{auth.authenticated ? 'Claim USDC' : 'Sign in to claim'} <ArrowUpRight size={16} /></button>
      {relayAvailable === false && <p className="small">Claiming is being set up. Your link remains available.</p>}
    </> : null}
    {(done || deposit?.status === 2) && (recipient || auth.embeddedAddress ? <ReceivingWallet address={(recipient || auth.embeddedAddress)!} /> : <button className="button full" disabled={!auth.ready} onClick={auth.login}>Sign in to access your wallet</button>)}
    {!deposit && !busy && <form onSubmit={event => { event.preventDefault(); try { const hash = linkInput.startsWith('#') ? linkInput : new URL(linkInput).hash; parseLink(hash, arc.id, escrowAddress!); window.history.replaceState(null, '', `/claim${hash}`); captureClaimFragment(); setLinkInput(''); setRevision(value => value + 1); } catch { setError('Paste the complete claim link.'); } }}><label className="field-label" htmlFor="open-link">Your private claim link</label><input id="open-link" className="standard" value={linkInput} onChange={event => setLinkInput(event.target.value)} autoComplete="off" spellCheck={false} /><button className="button full" disabled={!escrowAddress}>Open my link</button></form>}
    {busy && <p className="progress" role="status">{busy}</p>}{error && <p className="error" role="alert">{error}</p>}
    {!done && !busy && escrowAddress && <button className="text-link" onClick={() => setRevision(value => value + 1)}>Refresh deposit status</button>}
    {tx && <div><a className="text-link" href={transactionUrl(tx)} target="_blank" rel="noreferrer">View transaction <ArrowUpRight size={14} /></a></div>}
  </div></main>;
}
