# Implementation verification — September 16, 2026

Completed locally:

- TypeScript type checking: passed.
- Next.js ESLint checks: passed.
- 14 Vitest assertions/cases for exact native-USDC amounts, invalid input, fragment-only secrets, malformed links, network/contract mismatches, and signature domain binding: passed.
- Nine local-EVM contract scenarios: zero input rejection; exact deposit accounting; invalid signatures and replay domains; missing deposits and unauthorized cancellation; relayed payout to the signed recipient; double-spend prevention; sender refunds; failed recipient transfers; reentrancy prevention. All passed.
- Desktop (1440 px) and mobile (390 px) browser rendering: inspected. No horizontal overflow on mobile. Landing amount presets, send-page preset propagation, route navigation, FAQ expansion, wallet menu and Escape dismissal passed. No browser page errors.
- Full browser flow against a Ganache EVM with chain ID 5042 and separate injected test wallets: deposit 12.345678 USDC; reload and recover the same link without a second deposit; recipient claim; already-claimed state; second deposit; sender cancellation; cancelled-link state. Passed.
- Production Next.js build: passed. WalletConnect's optional `pino-pretty` logger produces an upstream warning; it does not block the build.
- Live, read-only request to `https://rpc.mainnet.arc.io`: returned chain ID 5042 and block 21138612. No private key was used and no live transaction was sent.

The local EVM checks do not simulate every Arc-specific rule, especially USDC blocklisting and unusual receipt behavior. No escrow has been deployed on Arc, no real-wallet Arc transfer has been tested, and the contract is not independently audited.

Reproducible core commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:contracts`, `pnpm build`, and `pnpm check:network`. Visual/browser checks used local Chrome with Playwright; the temporary harness and screenshots are ignored under `output/qa`.

## Frosted UI restoration

Restored Beam-style floating glass navigation, token → amount → review screens, glass receipts and official USDC branding. Typecheck, lint, 14 link/amount tests and production build passed. The build includes concurrent Privy code and emits upstream dynamic-import warnings from ox/Tempo.

Browser checks passed on desktop and mobile in preview mode: official USDC SVG loads, the send wizard advances, zero amounts are rejected, review displays the amount, Back preserves it, mobile has no horizontal overflow, and the navigation menu closes with Escape. No page errors were observed. Screenshots were inspected.

The earlier local injected-wallet end-to-end harness could not be reused after concurrent changes replaced that connection path with Privy-only auth. The historical successful transaction tests above predate that integration. This UI pass does not establish working Privy login or sponsored claims; those require configured integration tests.
