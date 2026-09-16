'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, Zap, Shield, Wallet, Undo2, History, Globe, Code2, ArrowUpRight, Menu, X } from 'lucide-react';
import { LUMA_MARK_PATH } from '@/lib/luma-brand';

const groups = [
  { label: 'Getting started', items: [{ id: 'overview', label: 'Overview', icon: BookOpen }, { id: 'quick-start', label: 'Send USDC', icon: Zap }] },
  { label: 'Using Luma', items: [{ id: 'link-security', label: 'Link security', icon: Shield }, { id: 'wallets-fees', label: 'Wallets & fees', icon: Wallet }, { id: 'cancellation', label: 'Cancel a link', icon: Undo2 }, { id: 'recovery', label: 'History & recovery', icon: History }] },
  { label: 'Reference', items: [{ id: 'network', label: 'Network', icon: Globe }, { id: 'developers', label: 'For developers', icon: Code2 }] },
];

export function LumaDocsShell({ children, preview = false }: { children: ReactNode; preview?: boolean }) {
  const [active, setActive] = useState('overview');
  const [open, setOpen] = useState(false);
  const content = useRef<HTMLElement>(null);

  useEffect(() => {
    if (preview) return;
    const root = content.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>('.luma-docs-section'));
    const update = () => {
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 2) {
        setActive(sections.at(-1)?.id || 'overview');
        return;
      }
      const top = root.getBoundingClientRect().top + 130;
      const current = sections.filter(section => section.getBoundingClientRect().top <= top).at(-1);
      setActive(current?.id || 'overview');
    };
    const followHash = () => {
      const section = sections.find(item => `#${item.id}` === window.location.hash);
      section?.scrollIntoView({ block: 'start' });
      setOpen(false);
      update();
    };
    followHash();
    root.addEventListener('scroll', update, { passive: true });
    window.addEventListener('hashchange', followHash);
    return () => { root.removeEventListener('scroll', update); window.removeEventListener('hashchange', followHash); };
  }, [preview]);

  return <div className={`luma-docs-root ${preview ? 'luma-docs-embedded' : 'luma-docs-site'}`}>
    <div className="luma-docs-mobile-bar"><a href="/">luma <span>/ docs</span></a><button type="button" aria-label={open ? 'Close documentation menu' : 'Open documentation menu'} aria-expanded={open} aria-controls="luma-docs-nav" onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}</button></div>
    <aside className={`luma-docs-sidebar${open ? ' is-open' : ''}`}>
      <a href="/" className="luma-docs-logo"><svg viewBox="94 165 544 385" aria-hidden="true"><path d={LUMA_MARK_PATH} fill="currentColor"/></svg>luma<span>docs</span></a>
      <nav id="luma-docs-nav" aria-label="Documentation sections">{groups.map(group => <div className="luma-docs-nav-group" key={group.label}><div className="luma-docs-group-label">{group.label}</div>{group.items.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => { setActive(id); setOpen(false); }}><Icon size={17}/>{label}</a>)}</div>)}</nav>
      <a href="/send" className="luma-docs-back">Open Luma <ArrowUpRight size={16}/></a>
    </aside>
    <main ref={content} className="luma-docs-reader" tabIndex={0} aria-label="Luma documentation">
      <div className="luma-docs-topline"><span>Documentation <span>/</span> Luma</span><a href="/">Back to app <ArrowUpRight size={14}/></a></div>
      {children}
    </main>
  </div>;
}
