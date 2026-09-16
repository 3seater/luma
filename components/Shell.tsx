import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { GlassHeader } from './GlassHeader';
import { arc } from '@/lib/arc';
import { LUMA_MARK_PATH } from '@/lib/luma-brand';
export function LumaMark() {
  return <svg viewBox="94 165 544 385" fill="none" aria-hidden="true"><path d={LUMA_MARK_PATH} fill="currentColor" /></svg>;
}
export function UsdcCoin({ className = '' }: { className?: string }) {
  // Official, unmodified token artwork from Circle's USDC brand kit.
  // eslint-disable-next-line @next/next/no-img-element
  return <span className={`usdc-coin ${className}`}><img src="/brand/usdc.svg" width="96" height="96" alt="USDC" /></span>;
}
export function Navbar() {
  return <GlassHeader />;
}
export function Footer() {
  const columns = [
    { title: 'Explore', links: [['How it works', '/#how-it-works'], ['Why Luma', '/#why-luma'], ['FAQ', '/#faq'], ['Docs', '/docs']] },
    { title: 'Product', links: [['Send a Luma', '/send'], ['Claim', '/claim'], ['Your Lumas', '/history'], ['Your wallet', '/wallet']] },
    { title: 'Resources', links: [['Arc', 'https://www.arc.io'], ['Argus', '']] },
    { title: 'Legal', links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']] },
  ];
  return <footer className="premium-footer"><div className="layout"><div className="footer-columns"><Link href="/" className="wordmark" aria-label="Luma home"><LumaMark />luma</Link>{columns.map(column => <nav key={column.title} aria-label={column.title}><h3>{column.title}</h3>{column.links.map(([label, href]) => href ? <Link key={label} href={href}>{label}</Link> : <span key={label} className="footer-pending-link">{label}</span>)}</nav>)}</div><div className="footer-bottom"><span>© {new Date().getFullYear()} Luma</span><span className="footer-token-ca"><span>$LUMA is not live yet. CA:</span><span role="img" aria-label="Contract address not yet released"><span className="footer-token-ca-blur" aria-hidden="true">0xXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</span></span></span><a href="https://www.arc.io" target="_blank" rel="noreferrer">Built on {arc.name} <ArrowUpRight size={13} /></a></div></div></footer>;
}
