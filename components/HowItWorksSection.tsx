'use client';

import { ArrowUpRight, Link2 } from 'lucide-react';
import { UsdcCoin } from './Shell';
export function HowItWorksSection() {
  return <section id="how-it-works" className="premium-section how-section" aria-labelledby="hiw-heading"><div className="layout"><div className="section-heading"><div><h2 id="hiw-heading">Choose an amount.<br /><span>Send a link.</span></h2></div></div><ol className="steps-grid">
    <li className="step-card"><div className="step-art token-art" aria-hidden="true"><span className="token-disc token-eth"><UsdcCoin /></span><div className="mini-amount">$100<span>Choose your amount</span></div></div><div className="step-copy"><span className="step-number">01</span><h3>Choose your amount.</h3><p>Choose how much USDC to send.</p></div></li>
    <li className="step-card"><div className="step-art share-art" aria-hidden="true"><div className="share-bubble"><UsdcCoin /> $100 USDC <span>↗</span></div><div className="share-link"><Link2 size={18} /> luma / claim<span>↗</span></div><div className="share-apps"><span>Messages</span><span>WhatsApp</span><span>Anywhere</span></div></div><div className="step-copy"><span className="step-number">02</span><h3>Share your link.</h3><p>Share the link in any conversation.</p></div></li>
    <li className="step-card"><div className="step-art receive-art" aria-hidden="true"><div className="receive-mark"><UsdcCoin /></div><div className="receive-notice"><UsdcCoin />USDC received.<ArrowUpRight size={18} /></div></div><div className="step-copy"><span className="step-number">03</span><h3>Sign in. Claim. It’s yours.</h3><p>They sign in and claim. No existing wallet needed.</p></div></li>
  </ol></div></section>;
}
