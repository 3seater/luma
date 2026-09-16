import { Check, ArrowUpRight } from 'lucide-react';
import { LumaMark, UsdcCoin } from './Shell';
import { arc } from '@/lib/arc';

export function GiftCard({ amount, label = 'Your Luma', status = 'Review & send' }: { amount: string; label?: string; status?: string }) {
  return <div className="luma-gift-card">
    <div className="gift-top"><span><LumaMark /> {label}</span><ArrowUpRight size={16} /></div>
    <div className="gift-value">{amount}<span> USDC</span></div>
    <div className="gift-token"><UsdcCoin /><span>USDC</span></div>
    <div className="gift-bottom"><span>On {arc.name}</span><span><Check size={12} />{status}</span></div>
  </div>;
}
