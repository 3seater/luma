import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import '../article-usdc/poster.css';

export const metadata = { title: 'Luma launch artwork', robots: { index: false, follow: false } };
export default function Launch() {
  const svg = readFileSync(join(process.cwd(), 'public/social/luma-usdc-constellation.svg'), 'utf8');
  return <main className="article-banner-page">
    <div className="article-banner-art" dangerouslySetInnerHTML={{ __html: svg }}/>
    <div className="article-banner-tools"><span>2048 × 2048 · USDC constellation</span><a href="/social/luma-usdc-constellation.png" download>Download PNG ↗</a><a href="/social/luma-usdc-constellation.svg" download>Download SVG ↗</a></div>
  </main>;
}
