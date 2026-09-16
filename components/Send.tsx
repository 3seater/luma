'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAccount, useBalance, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi';
import { formatUnits, parseEventLogs, type Hash, type Hex, type Address } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { ArrowUpRight, ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react';
import { arc, escrowAddress, escrowAbi, transactionUrl } from '@/lib/arc';
import { makeLink, parseAmount } from '@/lib/links';
import { saveHistory } from '@/lib/history';
import { backupLink } from '@/lib/backup-client';
import { userError, verifyEscrow } from '@/lib/transactions';
import { UsdcCoin } from './Shell';
import { Wallet } from './Wallet';
import { GiftCard } from './GiftCard';

type Pending = { key: Hex; sender: Address; amount: string; hash?: Hash };
const pendingKey = `arc-send:pending:${arc.id}:${escrowAddress}`;
export function Send() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: arc.id });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const balance = useBalance({ address, chainId: arc.id, query: { enabled: !!address } });
  const [amount, setAmount] = useState('100');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [tx, setTx] = useState<Hash>();
  const [id, setId] = useState('');
  const [pending, setPending] = useState<Pending>();
  const [copied, setCopied] = useState(false);
  const [warning, setWarning] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    const suggested = new URLSearchParams(window.location.search).get('amount');
    if (suggested) { try { parseAmount(suggested); setAmount(suggested); setStep(2); } catch { /* Ignore invalid optional presets. */ } }
    try {
      const saved = sessionStorage.getItem(pendingKey);
      if (saved) {
        const record = JSON.parse(saved) as Pending;
        privateKeyToAccount(record.key); parseAmount(record.amount);
        setPending(record); setAmount(record.amount); setTx(record.hash); setStep(3);
      }
    } catch { setWarning('This browser could not restore the pending link. Use Your links to recover an unclaimed deposit by ID.'); }
  }, []);
  async function finish(record: Pending) {
    if (!client || !escrowAddress || !record.hash) return;
    setBusy('Waiting for your deposit to confirm…');
    const receipt = await client.waitForTransactionReceipt({ hash: record.hash, timeout: 120000, onReplaced: replacement => {
      record.hash = replacement.transaction.hash; setTx(record.hash);
      sessionStorage.setItem(pendingKey, JSON.stringify(record));
    } });
    if (receipt.status !== 'success') {
      sessionStorage.removeItem(pendingKey); setPending(undefined);
      throw new Error('The deposit reverted. No claim link was created.');
    }
    const signer = privateKeyToAccount(record.key).address;
    const logs = parseEventLogs({ abi: escrowAbi, logs: receipt.logs, eventName: 'Deposited' });
    const event = logs.find(event => event.address.toLowerCase() === escrowAddress!.toLowerCase() && event.args.claimSigner.toLowerCase() === signer.toLowerCase() && event.args.sender.toLowerCase() === record.sender.toLowerCase() && event.args.amount === parseAmount(record.amount));
    if (!event) throw new Error('This transaction did not create the expected deposit. Check the transaction before sending again.');
    const depositId = event.args.id;
    setId(String(depositId)); setTx(receipt.transactionHash);
    const claimLink = makeLink(window.location.origin, { key: record.key, id: depositId, chainId: arc.id, escrow: escrowAddress });
    setLink(claimLink);
    try { await backupLink(claimLink, record.sender); setWarning(''); }
    catch { setWarning('Your link is ready, but its backup was not saved. Keep a copy and retry the backup.'); }
    if (!saveHistory({ id: String(depositId), sender: record.sender, amount: record.amount, hash: receipt.transactionHash })) setWarning(`History could not be saved. Keep deposit ID ${depositId} and your link.`);
    setBusy(''); balance.refetch();
  }
  async function send() {
    if (lock.current || !address || !client || !escrowAddress) return;
    lock.current = true; setError('');
    let submitted = false;
    try {
      const value = parseAmount(amount);
      setBusy('Checking Arc and your escrow…');
      await verifyEscrow(client, escrowAddress);
      if (chainId !== arc.id) await switchChainAsync({ chainId: arc.id });
      const record: Pending = { key: generatePrivateKey(), sender: address, amount };
      // Save locally before depositing; back up to the first-party encrypted store after confirmation.
      sessionStorage.setItem(pendingKey, JSON.stringify(record));
      const fees = await client.estimateFeesPerGas();
      const maxFeePerGas = (fees.maxFeePerGas ?? 0n) < 20_000_000_000n ? 20_000_000_000n : fees.maxFeePerGas!;
      const args = [privateKeyToAccount(record.key).address] as const;
      const gasEstimate = await client.estimateContractGas({ address: escrowAddress, abi: escrowAbi, functionName: 'deposit', args, account: address, value });
      const gas = gasEstimate * 120n / 100n;
      const available = await client.getBalance({ address });
      if (available < value + gas * maxFeePerGas) throw new Error('Keep enough USDC in your wallet for the amount and network fee.');
      setBusy('Confirm your USDC deposit in your wallet…');
      record.hash = await writeContractAsync({ address: escrowAddress, abi: escrowAbi, functionName: 'deposit', args, value, gas, maxFeePerGas, maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? 0n, chainId: arc.id, account: address });
      submitted = true; setPending(record); setTx(record.hash);
      sessionStorage.setItem(pendingKey, JSON.stringify(record));
      await finish(record);
    } catch (e) {
      setError(userError(e));
      if (!submitted) { try { sessionStorage.removeItem(pendingKey); } catch { /* Storage may be unavailable. */ } }
    } finally { setBusy(''); lock.current = false; }
  }
  async function resume() {
    if (!pending?.hash || lock.current) return;
    lock.current = true; setError('');
    try { await finish(pending); } catch (e) { setError(userError(e)); } finally { setBusy(''); lock.current = false; }
  }
  const title = link ? 'Your Luma is ready' : busy ? 'Sending…' : step === 1 ? 'Choose a token' : step === 2 ? 'Set an amount' : 'Confirm & send';
  const next = () => {
    try { parseAmount(amount); setError(''); setStep(3); }
    catch (e) { setError(userError(e)); }
  };
  return <main className="flow-page send-flow-page">
    <div className="send-flow-wrap">
      {!link && <ol className="flow-steps" aria-label="Send progress">{['Token', 'Amount', 'Send'].map((label, index) => <li key={label} className={step === index + 1 ? 'current' : step > index + 1 ? 'complete' : ''} aria-current={step === index + 1 ? 'step' : undefined}><span>{step > index + 1 ? <Check size={11} /> : index + 1}</span>{label}</li>)}</ol>}
      {link && <div className="receipt-moment"><span className="receipt-check"><Check size={24} /></span><h1>Your Luma is ready.</h1></div>}
      <div className={link ? 'flow-receipt' : 'flow-card flow-wizard'}>
        {!link && <div className="wizard-header"><button className="glass-back" disabled={!!busy || !!pending?.hash} aria-label="Back" onClick={() => { setError(''); if (step === 1) window.location.assign('/'); else setStep(step === 3 ? 2 : 1); }}><ArrowLeft size={18} /></button><h1>{title}</h1><span /></div>}
        <div className={link ? 'receipt-content' : 'wizard-body'}>
          {link ? <>
            <GiftCard amount={amount} status="Ready to share" />
            <div className="receipt-sharing">
              <label className="field-label" htmlFor="claim-link">Your private claim link</label>
              <textarea id="claim-link" className="link-output" readOnly value={link} rows={3} />
              <button className="button full" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError('Clipboard unavailable. Select and copy the link above.'); } }}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Link copied' : 'Copy claim link'}</button>
              <p className="small center">Anyone with the full link can claim once. Share privately.</p>
              <details className="receipt-details"><summary>Deposit #{id} · Recovery details</summary><p className="small">Your link is backed up securely when the backup succeeds. Use the same sending wallet in Your links to recover it on any device or cancel an unclaimed deposit.</p><button className="button secondary full" onClick={async () => { if (!pending) return; try { await backupLink(link, pending.sender); setWarning('Backup saved. Recover this link with the same sending wallet on any device.'); } catch { setWarning('Backup unavailable. Keep a copy of your link and try again.'); } }}>Save backup again</button></details>
              <button className="button secondary full" onClick={() => { sessionStorage.removeItem(pendingKey); setPending(undefined); setLink(''); setTx(undefined); setId(''); setCopied(false); setError(''); setWarning(''); setStep(1); }}>Send another link</button>
            </div>
          </> : busy ? <div className="sending-stage" role="status"><div className="sending-orbit"><UsdcCoin /></div><h2>{busy}</h2><p>Keep this tab open. Your link will appear after confirmation.</p></div> : step === 1 ? <div className="wizard-stage">

            <button className="token-choice" onClick={() => { setStep(2); setError(''); }}><UsdcCoin /><span><strong>USDC</strong><small>USDC on {arc.name}</small></span><ArrowRight size={18} /></button>

          </div> : step === 2 ? <div className="wizard-stage">
            <button className="selected-token" onClick={() => setStep(1)} aria-label="Back to token selection"><UsdcCoin /><span><strong>USDC</strong><small>{arc.name}</small></span><span className="token-change">Change</span></button>
            <label className="field-label" htmlFor="amount">How much would you like to send?</label>
            <div className="amount-field"><span className="amount-dollar">$</span><input id="amount" inputMode="decimal" autoComplete="off" value={amount} onChange={e => { setAmount(e.target.value); setError(''); }} aria-describedby={error ? 'send-error' : undefined} /><span>USDC</span></div>
            <div className="presets">{['25','50','100','250'].map(value => <button key={value} className={amount === value ? 'active' : ''} onClick={() => { setAmount(value); setError(''); }}>${value}</button>)}</div>
            <div className="detail-row"><span>Available</span><strong>{balance.data ? Number(formatUnits(balance.data.value, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 }) + ' USDC' : address ? balance.isError ? 'Unavailable' : 'Loading…' : 'Connect to view balance'}</strong></div>
            <button className="button full wizard-continue" onClick={next}>Continue <ArrowRight size={17} /></button>
          </div> : <div className="wizard-stage">
            <GiftCard amount={amount} />
            <div className="review-details"><div className="detail-row"><span>Application fee</span><strong>0 USDC</strong></div><div className="detail-row"><span>Network fee</span><strong>Shown in your wallet</strong></div><div className="detail-row"><span>Recipient gets</span><strong>{amount} USDC</strong></div></div>
            {!escrowAddress && <p className="notice">Sending is not live yet. The Arc escrow must be deployed and configured first.</p>}
            {pending?.hash ? <button className="button full" onClick={resume}>Recover pending link <ArrowUpRight size={16} /></button> : !address ? <Wallet /> : <button className="button full" disabled={!escrowAddress} onClick={send}>Send USDC <ArrowUpRight size={17} /></button>}

          </div>}
          {error && <p id="send-error" className="error" role="alert">{error}</p>}{warning && <p className="notice">{warning}</p>}
          {tx && <a className="text-link" href={transactionUrl(tx)} target="_blank" rel="noreferrer">View transaction <ArrowUpRight size={14} /></a>}
        </div>
      </div>
      <div className="flow-under"><Link href="/history">Your links ↗</Link></div>
    </div>
  </main>;
}
