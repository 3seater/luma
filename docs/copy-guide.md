# Luma copy

This file supersedes Beam's previous stocks-and-crypto positioning under the user's explicit Arc-only reskin request.

- Name: Luma. Send **USDC on Arc** through a link.
- Public identity: Twitter/X `@uselumacash` (`https://x.com/uselumacash`); website `useluma.cash` (`https://useluma.cash`).
- User-supplied public $LUMA CA: `0xe08808ab2a67230e83d893c631c48de648e6f8f2`. Display it unblurred in the footer and link Argus to `https://argus.world/token/0xe08808ab2a67230e83d893c631c48de648e6f8f2`. This is separate from the USDC escrow address.
- Preserve Beam's flow: sender signs in, sends and shares; recipient opens the link, signs in with Privy, receives an embedded wallet and claims without pre-funding gas.
- Privy embedded EVM wallets and sponsored claims are implemented; see `docs/service-setup.md`. Distinguish implemented behavior from live availability, which requires configured services and end-to-end testing.
- Anyone with the full link can claim once. Share privately.
- Sender may cancel only before claim confirmation. No automatic expiry.
- No application fee. Sender pays the deposit network fee in USDC; the funded relayer pays the recipient's claim fee. Subsequent outgoing transfers use the recipient's USDC for gas.
- Supabase stores encrypted claim-link backups. Signing with the same sending wallet enables recovery on any device. Never imply another wallet or an unauthenticated viewer can recover links.
- No stocks, bundles, swaps, arbitrary tokens, fiat checkout, guaranteed settlement timing, or official affiliation claims.
- Never describe the contract as audited or live without deployment and review evidence.

Colors: midnight navy #06162b, steel blue #254c6c, sea-glass #87b3bc, warm sand #dfcca1. Keep the simple landing hierarchy and glass-like preview from Beam. References are supplied by the user.

UI direction: preserve Beam's floating frosted-glass navigation, stepped token → amount → review flow, translucent cards and floating share receipt. Use the official USDC token logo. The approved Luma logo/PFP remains unchanged.
