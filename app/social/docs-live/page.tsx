import { ArrowUpRight } from 'lucide-react';
import { LumaMark } from '@/components/Shell';
import { LumaDocsContent } from '@/components/LumaDocsContent';
import { LumaDocsShell } from '@/components/LumaDocsShell';
import '@/app/docs/docs.css';
import './poster.css';

export const metadata = { title: 'Docs are live — design preview', robots: { index: false, follow: false } };

export default function DocsLaunch({ searchParams }: { searchParams: { native?: string } }) {
  return <div className={`luma-docs-poster${searchParams.native === '1' ? ' luma-docs-native' : ''}`}>
    <article className="luma-docs-artboard" aria-label="Luma Docs are live announcement, approved design reference">
      <div className="luma-docs-curves" aria-hidden="true"><i /><i /><i /></div>
      <div className="luma-docs-brand"><LumaMark /><span>luma</span></div>
      <h1 className="luma-docs-headline">Docs<br />are live.</h1>
      <div className="luma-docs-labels"><a href="https://x.com/uselumacash">@uselumacash</a><a href="https://useluma.cash">useluma.cash <ArrowUpRight size={26} strokeWidth={1.5} /></a></div>
      <div className="luma-docs-window">
        <div className="luma-docs-chrome"><LumaMark /><span>luma <span className="luma-docs-slash">/</span> docs</span><ArrowUpRight size={22} strokeWidth={1.5} /></div>
        <div className="luma-docs-surface"><LumaDocsShell preview><LumaDocsContent /></LumaDocsShell></div>
      </div>
    </article>
  </div>;
}
