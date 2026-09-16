'use client';
import Link from 'next/link';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronRight, Copy, LogOut } from 'lucide-react';
import { arc, shortAddress } from '@/lib/arc';
import { readHistory, type HistoryItem } from '@/lib/history';
import { useAuth } from './Auth';
import { UsdcCoin } from './Shell';
export function Wallet() {
  const auth = useAuth();
  const { address, chainId } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => { if (open && address) setHistory(readHistory(address).slice(0, 3)); }, [open, address]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside); };
  }, []);
  if (!auth.authenticated && !address) return <div className="wallet-control"><button className="wallet-button" disabled={!auth.configured || !auth.ready} title={!auth.configured ? 'Wallet connection is not configured yet' : undefined} onClick={auth.connectWallet}>Connect wallet</button></div>;
  async function disconnect() {
    try { await disconnectAsync(); if (auth.authenticated) await auth.logout(); setOpen(false); }
    catch { setError('Could not disconnect. Please try again.'); }
  }
  return <div className="wallet-control" ref={root}><button ref={trigger} className="wallet-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id}><span className="status-dot" />{address ? shortAddress(address) : 'Your account'}</button>
    {open && <div id={id} className="wallet-menu restored-wallet" role="region" aria-label="Wallet menu">
      <div className="wallet-menu-heading"><strong>{address ? shortAddress(address) : 'Your account'}</strong><button aria-label="Copy address" disabled={!address} onClick={async () => { try { await navigator.clipboard.writeText(address!); setCopied(true); } catch { setError('Could not copy your address.'); } }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button><button className="wallet-disconnect" aria-label="Disconnect wallet" onClick={disconnect}><LogOut size={16} /></button></div>
      {address && chainId !== arc.id && <button className="wallet-menu-action" onClick={async () => { try { await switchChainAsync({ chainId: arc.id }); } catch { setError('Could not switch to Arc. Please try again.'); } }}>Switch to {arc.name}<ChevronRight size={15} /></button>}
      <Link className="wallet-menu-action" href="/wallet" onClick={() => setOpen(false)}>Your receiving wallet<ChevronRight size={15} /></Link><div className="wallet-recent"><span>Recent Lumas</span>{history.length ? history.map(item => <Link key={item.id} href="/history" onClick={() => setOpen(false)}><UsdcCoin /><strong>{item.amount} USDC</strong><ChevronRight size={14} /></Link>) : <p>No links sent yet.</p>}</div>
      <button className="wallet-menu-action" onClick={auth.connectWallet}>Connect another wallet<ChevronRight size={15} /></button>
      {auth.embeddedAddress && <button className="wallet-menu-action" onClick={async () => { try { await auth.exportWallet(); } catch { setError('Could not open your wallet. Please try again.'); } }}>Export your wallet<ChevronRight size={15} /></button>}
      <Link className="wallet-menu-action wallet-all" href="/history" onClick={() => setOpen(false)}>View all Lumas<ChevronRight size={16} /></Link>
      {error && <p role="alert" className="error">{error}</p>}
    </div>}
  </div>;
}
