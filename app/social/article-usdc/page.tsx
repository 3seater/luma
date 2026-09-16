import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import './poster.css';

export const metadata = { title: 'USDC article banner', robots: { index: false, follow: false } };

export default function ArticleBanner({ searchParams }: { searchParams: { native?: string } }) {
  const svg = readFileSync(join(process.cwd(), 'public/social/luma-usdc-article.svg'), 'utf8');
  return <main className={`article-banner-page${searchParams.native === '1' ? ' article-banner-native' : ''}`}>
    <div className="article-banner-art" dangerouslySetInnerHTML={{ __html: svg }} />
    <div className="article-banner-tools"><span>2400 × 960 · 5:2 · Vector artwork</span><a href="/social/luma-usdc-article.png" download="luma-usdc-article.png">Download PNG ↗</a><a href="/social/luma-usdc-article.svg" download="luma-usdc-article.svg">Download SVG ↗</a></div>
  </main>;
}
