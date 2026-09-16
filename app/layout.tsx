import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './frosted.css';
import './beam-landing.css';
import './hero-demo.css';
import './landing-motion.css';
import './luma-restoration.css';
import { Providers } from '@/components/Providers';
import { Navbar, Footer } from '@/components/Shell';
const geist = localFont({ src: './fonts/GeistVF.woff', display: 'swap' });
export const metadata: Metadata = {
  title: { default: 'Luma — USDC, sent by link.', template: '%s · Luma' },
  description: 'Connect your wallet, deposit USDC on Arc, and share a link. Anyone with the complete link can claim to their wallet.',
  icons: { icon: '/brand/luma-favicon.svg' },
  referrer: 'no-referrer',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={geist.className}><Providers><Navbar />{children}<Footer /></Providers></body></html>;
}
