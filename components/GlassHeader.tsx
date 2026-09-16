'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Wallet } from './Wallet';
import { LUMA_MARK_PATH } from '@/lib/luma-brand';

export function GlassHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  return <header className="frost-header">
    <nav className="frost-nav" aria-label="Main navigation">
      <Link href="/" className="wordmark" aria-label="Luma home"><svg viewBox="94 165 544 385" aria-hidden="true"><path d={LUMA_MARK_PATH} fill="currentColor" /></svg>luma</Link>
      <div className="glass-nav-links"><Link href="/#how-it-works">How it works</Link><Link href="/history">Your links</Link><Link href="/docs">Docs</Link></div>
      <Link href="/send" className="button nav-send">Send USDC <ArrowUpRight size={15} /></Link>
      <button className="glass-menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="glass-mobile-nav" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    </nav>
    <div className="glass-header-wallet"><Wallet /></div>
    {open && <nav id="glass-mobile-nav" className="glass-mobile-nav" aria-label="Mobile navigation"><Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link><Link href="/history">Your links</Link><Link href="/docs">Docs</Link><Link href="/send" className="button">Send USDC <ArrowUpRight size={16} /></Link></nav>}
  </header>;
}
