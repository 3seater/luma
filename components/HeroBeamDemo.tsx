'use client';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Link2, RotateCcw } from 'lucide-react';
import { LumaMark, UsdcCoin } from './Shell';
const STEPS = ['Choose', 'Share', 'Claim'];
const AMOUNTS = [10, 50, 100];
export function HeroBeamDemo() {
  const asset = 'USDC';
  const [amount, setAmount] = useState<number>(100);
  const [step, setStep] = useState(0);



  return (
    <div className="hero-demo" aria-label="Interactive Luma preview">
      <div className="hero-demo-header">
        <span><LumaMark /> Try a Luma</span>
        <span className="hero-demo-label">Interactive preview</span>
      </div>

      <div className="hero-demo-steps" role="group" aria-label="Preview the sending process">
        {STEPS.map((label, index) => (
          <button key={label} type="button" aria-pressed={step === index} onClick={() => setStep(index)}>
            <span>{index < step ? <Check size={12} /> : index + 1}</span>{label}
          </button>
        ))}
      </div>

      <div className="hero-demo-currency"><UsdcCoin /> USDC <span>Arc</span></div>

      <div className="hero-demo-stage" data-step={step}>
        <div className="hero-demo-beam">
          <div className="hero-demo-card-top">
            <span>{step === 0 ? 'Your Luma' : step === 1 ? 'Sent you a Luma.' : 'Luma claimed'}</span>
            {step === 2 ? <span className="hero-demo-check"><Check size={16} /></span> : <ArrowUpRight size={18} />}
          </div>
          <div className="hero-demo-value" aria-live="polite" aria-atomic="true">
            <span>${amount}<span>.00</span></span>
            <span className="hero-demo-asset">
              <UsdcCoin />
              <span>{asset}</span>
            </span>
          </div>
          <div className="hero-demo-card-bottom">
            {step === 0
              ? <span>Choose how much to send.</span>
              : step === 1
                ? <><Link2 size={14} /><span>One private link. Ready to share.</span></>
                : <><Check size={14} /><span>${amount} of {asset}, received.</span></>}
          </div>
        </div>

        <div className="hero-demo-detail">
          {step === 0 ? (
            <div className="hero-demo-amounts" role="group" aria-label="Preview an amount">
              {AMOUNTS.map(value => (
                <button key={value} type="button" aria-pressed={amount === value} onClick={() => setAmount(value)}>
                  ${value}
                </button>
              ))}
            </div>
          ) : step === 1
            ? <p><span className="hero-demo-link">luma / claim / ••••••</span>Send the link in any conversation.</p>
            : <p>They sign in and claim. No existing wallet needed.</p>}
        </div>
      </div>

      <button className="hero-demo-next" type="button" onClick={() => setStep((step + 1) % STEPS.length)}>
        {step === 0 ? 'Preview the link' : step === 1 ? 'See how they claim' : 'Try another Luma'}
        {step === 2 ? <RotateCcw size={16} /> : <ArrowRight size={17} />}
      </button>
    </div>
  );
}
