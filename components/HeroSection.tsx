'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { HeroBeamDemo } from './HeroBeamDemo';

import '@/app/hero-demo.css';
export interface HeroSectionProps {
  onSendClick?: () => void;
}
export function HeroSection({
  onSendClick
}: HeroSectionProps) {
  const router = useRouter();

  const handleSend = () => onSendClick ? onSendClick() : router.push('/send');
  return <section id="hero" className="premium-hero" aria-labelledby="hero-title">
    <div className="hero-atmosphere" aria-hidden="true" />
    <div className="layout hero-grid"><div className="hero-copy">
      <h1 id="hero-title">Internet money<br /><span>made easy.</span></h1>
      <p>Send USDC to anyone in a few taps.</p>
      <div className="hero-actions"><button className="premium-button" onClick={handleSend}>Send a Luma <ArrowUpRight size={18} /></button><a className="text-link" href="#how-it-works">See how it works <ArrowRight size={16} /></a></div>
    </div><HeroBeamDemo /></div>
    <div className="layout hero-base"><span>Built on Arc <ArrowUpRight size={12} /></span></div>
  </section>;
}
