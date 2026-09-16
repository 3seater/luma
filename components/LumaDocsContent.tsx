import { arc, escrowAddress } from '@/lib/arc';
import { Send, Link2, Wallet } from 'lucide-react';
export function LumaDocsContent() {
 return <article className="luma-docs-content">
 <section id="overview" className="luma-docs-section luma-docs-overview">
 <div className="luma-docs-eyebrow">GETTING STARTED</div>
 <h1>How Luma works.</h1>
 <p className="luma-docs-lead">USDC on Arc. Sent through a link.</p>
 <p>Learn how to send, share, and claim with Luma — and how your links stay protected.</p>
 <div className="luma-docs-cards">
 <a href="#quick-start"><Send size={22}/><h3>Send</h3><p>Choose an amount of USDC and confirm your deposit.</p><span>Get started ↗</span></a>
 <a href="#link-security"><Link2 size={22}/><h3>Share</h3><p>Send your private claim link to the recipient.</p><span>About links ↗</span></a>
 <a href="#wallets-fees"><Wallet size={22}/><h3>Claim</h3><p>Sign in and receive USDC in an embedded wallet.</p><span>Wallets & fees ↗</span></a>
 </div>
 <div className="luma-docs-note"><strong>Your link is the key.</strong> Anyone with the complete link can claim once. Share it privately.</div>
 </section>
 <section id="quick-start" className="luma-docs-section"><h2>Send USDC on Arc</h2><p>Luma lets you deposit USDC into an escrow contract and give someone a private link to claim it. Only USDC on Arc is supported.</p>
    <ol><li>Connect a wallet with USDC on Arc.</li><li>Choose an amount and confirm the deposit transaction.</li><li>Wait for confirmation, then copy and privately share your claim link.</li><li>The recipient opens the link, signs in through Privy, and claims to their embedded wallet. They do not need an existing wallet or USDC for the claim fee.</li></ol>
    </section>
<section id="link-security" className="luma-docs-section"><h2>Your link is the key</h2><p>Your browser creates a random claim key for each deposit. The full link carries it after the # symbol. This fragment is not part of the initial page request, but Luma sends it to its own backup service to save an encrypted recovery copy. The escrow stores only the key’s public address.</p><p>Anyone with the full link can claim its USDC once. Share it privately. The claim signature is bound to the recipient, deposit, chain, and contract, so copying a pending transaction cannot redirect the payout.</p>
    </section>
<section id="wallets-fees" className="luma-docs-section"><h2>Wallets and fees</h2><p>Privy provides wallet connection and sign-in. The recipient claims to a Privy embedded EVM wallet associated with their account. Luma’s funded relayer pays the claim network fee. The sender pays deposit and cancellation fees in USDC, and later transfers from the receiving wallet also require USDC for gas. There is no application fee.</p><p>Wallet sign-in, sponsored claims, and backups depend on configured services. If claiming is temporarily unavailable, the USDC stays in escrow until claimed or cancelled.</p>
    </section>
<section id="cancellation" className="luma-docs-section"><h2>Cancel an unclaimed link</h2><p>Open Your Lumas with your sending wallet and choose Cancel &amp; recover USDC. Once the cancellation confirms, the link can no longer be claimed. If a claim confirms first, cancellation fails. The original deposit returns to the sender; network fees are not refundable.</p>
    </section>
<section id="recovery" className="luma-docs-section"><h2>History and recovery</h2><p>Luma saves local deposit history and attempts an encrypted server backup after a deposit confirms. Open Your Lumas and verify the same sending wallet with a signature to recover backed-up links on another device. A different wallet cannot recover them, even if it belongs to the same person.</p><p>If the backup fails, keep a copy of the link and retry saving it. Tab storage can help restore a pending send after a refresh, but is not a permanent backup. Without a saved link or successful backup, a deposit ID cannot recreate the claim key; the original sending wallet can still look up and cancel an unclaimed deposit.</p>
    </section>
<section id="network" className="luma-docs-section"><h2>Network configuration</h2><table><tbody><tr><th>Network</th><td>{arc.name}</td></tr><tr><th>Chain ID</th><td>{arc.id}</td></tr><tr><th>Currency</th><td>USDC</td></tr><tr><th>Escrow</th><td><code>{escrowAddress || 'Not deployed / configured'}</code></td></tr><tr><th>Explorer</th><td><a href={arc.blockExplorers.default.url} target="_blank" rel="noreferrer">Arcscan ↗</a></td></tr></tbody></table>
    </section>
<section id="developers" className="luma-docs-section"><h2>For developers</h2><p>Next.js and React provide the interface, Privy handles authentication and embedded wallets, and wagmi and viem handle EVM interaction. Supabase stores encrypted link backups and relayer coordination records. The Solidity escrow accepts native USDC in 18-decimal units through a payable deposit. Arc’s 6-decimal ERC-20 USDC interface is not used for deposits.</p><p>The contract has no administrator, upgrade mechanism, arbitrary-token deposit function, or application fee. Deposits have no automatic expiry. Local automated tests are not an independent security audit. Live use requires a deployed, verified escrow and configured services.</p><p>Luma is independent and is not an official Arc or Circle product. See our <a href="/privacy">privacy policy</a> for how account, link, and transaction data are handled.</p></section>
 </article>;
}
