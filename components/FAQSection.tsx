'use client';
import { useState } from 'react';
const items = [
  ['Do they need a wallet?', 'No. They sign in and a wallet is created for them. They can also use an existing wallet.'],
  ['What can I send?', 'USDC on Arc.'],
  ['How is my link protected?', 'Anyone with the complete link can claim once. Share it privately.'],
  ['Can I take it back?', 'Yes. Open Your Lumas and cancel any unclaimed link to recover your USDC.'],
  ['Who pays the network fee?', 'The sender pays for the deposit. Luma sponsors the claim, so the recipient does not need USDC for gas.'],
  ['Can I recover my links?', 'Use the same sending wallet in Your Lumas to recover securely backed-up links on another device.'],
  ['Do links expire?', 'No. USDC stays in escrow until claimed or cancelled.'],
];
export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return <section id="faq" className="premium-section faq-section"><div className="layout faq-centered"><h2>FAQ</h2><div className="faq-panel luma-faq">{items.map(([question, answer], index) => <div key={question}><h3><button aria-expanded={open === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpen(open === index ? null : index)}>{question}<span>{open === index ? '−' : '+'}</span></button></h3><p id={`faq-answer-${index}`} hidden={open !== index}>{answer}</p></div>)}</div></div></section>;
}
