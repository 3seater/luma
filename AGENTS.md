# Luma project instructions

Read `docs/copy-guide.md` before changing user-facing copy. The user explicitly replaced Beam's stocks/crypto/bundle product with USDC-only sending on Arc. Old product instructions in Git history are superseded.

Keep the app independent from official Arc/Circle branding claims. Preserve the supplied navy/blue/sea-glass/sand palette and the simple send/share/claim structure.

Preserve Beam's Privy sign-in, embedded receiving wallets, sponsored claims and Supabase recovery. The user clarified that the same sending wallet must recover its links on any device; only bundles/Enso and multi-asset sending are removed.

Native USDC uses 18 decimals. Do not apply the ERC-20 interface's six-decimal accounting to msg.value or native balance. Signatures must remain bound to chain, escrow, deposit and recipient. Claim keys must never enter logs or analytics. The user authorized encrypted Supabase claim-link backups for cross-device recovery: transmit secrets only to the first-party backup endpoint over HTTPS, encrypt at rest, and verify sender wallet ownership before returning them. Never expose a full link through public history, RPC, Privy, or relay requests.

Run typecheck, lint, link/amount tests, contract tests and production build when changing transaction behavior. Never use an old Beam escrow address on Arc. Deployment and funding are separate operator actions; a build must not submit transactions.
