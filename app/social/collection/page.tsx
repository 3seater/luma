import { ArrowUpRight, ArrowRight, Check, Link2, ShieldCheck, Smartphone, Laptop, Wallet, Send } from 'lucide-react';
import { LumaMark, UsdcCoin } from '@/components/Shell';
import { GiftCard } from '@/components/GiftCard';
import type { ReactNode } from 'react';
import './collection.css';

export const metadata = { title: 'Luma graphics collection', robots: { index: false, follow: false } };
const designs = [
  { id: 'usdc', label: '01 · USDC on Arc', title: <>USDC.<br/>Simply sent.</>, sub: 'Internet money, made easy.' },
  { id: 'send', label: '02 · Send a Luma', title: <>Send a Luma.</>, sub: 'Choose an amount. Make it a link.' },
  { id: 'share', label: '03 · Share privately', title: <>Money.<br/>Meet message.</>, sub: 'One private link. Ready to share.' },
  { id: 'claim', label: '04 · Claim a Luma', title: <>Open. Claim.<br/>It’s yours.</>, sub: 'Sign in. Receive USDC. No existing wallet needed.' },
  { id: 'recover', label: '05 · Recover your links', title: <>Your links.<br/>With you.</>, sub: 'Recover backed-up links with the same sending wallet.' },
];

function LinkPill() { return <div className="kit-link"><Link2/><span>useluma.cash/claim</span><ArrowUpRight/></div>; }
function Tile({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={`kit-tile ${className}`}>{children}</div>; }
function FlowLine() { return <svg className="kit-flow" viewBox="0 0 1920 1080" fill="none" aria-hidden="true"><path d="M510 780C780 270 1180 300 1710 700" stroke="#eef4f5" strokeOpacity=".4" strokeWidth="2"/><path d="m1615 640 95 60-111-8" stroke="#eef4f5" strokeOpacity=".65" strokeWidth="2"/></svg>; }
function Artwork({ id }: { id: string }) {
  if (id === 'usdc') return <div className="kit-usdc-art"><Tile className="coin-main"><UsdcCoin/></Tile><Tile className="coin-small"><UsdcCoin/></Tile><Tile className="coin-back"><UsdcCoin/></Tile><div className="kit-network"><span/> USDC on Arc</div></div>;
  if (id === 'send') return <><FlowLine/><div className="kit-send-coin"><UsdcCoin/></div><div className="kit-receipt"><GiftCard amount="100" status="Ready to share"/></div><div className="kit-send-link"><LinkPill/></div><span className="kit-step-caption">Choose → Confirm → Share</span></>;
  if (id === 'share') return <><div className="kit-share-card"><GiftCard amount="25" status="Ready to share"/></div><div className="kit-message"><div className="kit-message-top"><Send size={28}/><span>A little something for you.</span></div><LinkPill/></div><div className="kit-private"><ShieldCheck size={30}/><span>Share privately. Claim once.</span></div><svg className="kit-share-line" viewBox="0 0 1920 1080" fill="none"><path d="M1070 420C1650 130 1830 590 1480 720" stroke="#eef4f5" strokeOpacity=".45" strokeWidth="2" strokeDasharray="8 12"/></svg></>;
  if (id === 'claim') return <><div className="kit-claim-orbit"/><div className="kit-claim-coin"><UsdcCoin/></div><div className="kit-claim-receipt"><GiftCard amount="100" label="Your Luma" status="Claimed"/></div><div className="kit-check"><Check size={75} strokeWidth={1.3}/></div><div className="kit-wallet-note"><Wallet size={28}/><span>A wallet is created if you need one.</span></div></>;
  return <><svg className="kit-recovery-lines" viewBox="0 0 1920 1080" fill="none"><path d="M1000 380Q1320 150 1600 430M1000 670Q1370 990 1610 655" stroke="#eef4f5" strokeOpacity=".45" strokeWidth="2" strokeDasharray="8 12"/></svg><Tile className="kit-laptop"><Laptop size={190} strokeWidth={1}/><span>Your sending wallet</span></Tile><Tile className="kit-phone"><Smartphone size={180} strokeWidth={1}/><span>Another device</span></Tile><div className="kit-recover-key"><Wallet size={60} strokeWidth={1.2}/><ArrowRight size={35}/></div><div className="kit-recover-link"><LinkPill/><div><ShieldCheck size={23}/> Same wallet. Your backed-up links.</div></div></>;
}

export default function Collection({ searchParams }: { searchParams: { design?: string; native?: string; preview?: string } }) {
  const selected = designs.find(design => design.id === searchParams.design);
  const shown = selected ? [selected] : designs;
  const native = searchParams.native === '1';
  const compact = searchParams.preview === '1' && !native;
  return <main className={`kit-page${compact ? ' kit-compact' : ' kit-export'}${native ? ' kit-native' : ''}${selected ? ' kit-single' : ''}`}>
    {!native && <header className="kit-toolbar"><div><span>LUMA / SOCIAL COLLECTION</span><h1>{compact ? 'Simple ideas. Made visual.' : 'All five. Ready for Figma.'}</h1><p>{compact ? 'Compact preview only. Use the export page for Figma.' : 'Capture this entire page. Each artwork is 1920 × 1080, with no CSS scaling.'}</p></div><a href={compact ? '/social/collection' : '/social/collection?preview=1'}>{compact ? 'Open export page' : 'Compact preview'} <ArrowUpRight size={18}/></a></header>}
    <div className="kit-gallery">{shown.map(design => <section className="kit-item" key={design.id}>
      {!native && <div className="kit-item-label"><span>{design.label}</span><a href={`/social/collection?design=${design.id}&native=1`}>1920 × 1080 ↗</a></div>}
      <div className="kit-stage"><article className={`kit-artboard kit-${design.id}`} aria-label={design.label}>
        <div className="kit-curves" aria-hidden="true"><i/><i/><i/></div>
        <div className="kit-brand"><LumaMark/><span>luma</span></div>
        <h2>{design.title}</h2><p className="kit-subtitle">{design.sub}</p>
        <Artwork id={design.id}/>
        <div className="kit-identities"><a href="https://x.com/uselumacash">@uselumacash</a><a href="https://useluma.cash">useluma.cash <ArrowUpRight size={26}/></a></div>
      </article></div>
    </section>)}</div>
  </main>;
}
