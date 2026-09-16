# Luma service setup

Luma preserves Beam's Privy sign-in, embedded receiving wallet, gasless claim and Supabase link recovery. Only bundles/Enso and multi-asset sending are removed; sends use native USDC on Arc.

## Accounts and configuration

- Privy: NEXT_PUBLIC_PRIVY_APP_ID and server-only PRIVY_APP_SECRET. Enable Apple, Google, X and wallet login, embedded Ethereum wallets, and allow the local and deployed origins. The app configures Arc and automatic wallet creation. JWT verification uses Privy's public app JWKS endpoint.
- Supabase: SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY. Run the two SQL migrations in supabase/migrations in filename order. They add encrypted link backups and shared relayer coordination. Existing Beam backups remain scoped to their own chain and escrow.
- Backup encryption: BEAM_BACKUP_ENCRYPTION_KEY is a 32-byte hex key. Store a separate secure backup and use the same value in every server environment. Losing or changing it makes existing encrypted backups unreadable. A key has been generated in the local environment if one was absent.
- Arc: NEXT_PUBLIC_ARC_NETWORK, NEXT_PUBLIC_ARC_ESCROW_ADDRESS and optional NEXT_PUBLIC_ARC_RPC_URL. ARC_RPC_URL is an optional server-only override for a credentialed RPC.
- Relayer: a dedicated RELAYER_PRIVATE_KEY, funded with native USDC on the selected Arc network. Do not use this wallet outside this relayer or share it with another app. RELAYER_MAX_CLAIM_FEE_USDC defaults to 0.1 and RELAYER_DAILY_BUDGET_USDC to 10. Budgets reserve the maximum possible fee, not the amount ultimately spent.

No Enso, Uniswap, 0x, token-pricing, Stripe, or separate WalletConnect project is required. Privy provides the wallet login interface.

## Deployment steps

1. Run the Supabase migrations. The service-role key accesses tables through REST; it cannot install SQL schema by itself.
2. Configure Privy login providers and allowed origins. Use the same Privy App ID on all devices/environments that should share embedded wallets.
3. Deploy a fresh ArcEscrow to the chosen network using the existing deployment script; configure the returned address. Never reuse Beam's escrow.
4. Create and fund a dedicated relayer on that network, then configure its server-only key and budgets. Deployment and funding are separate operator actions, never build actions.
5. Rebuild and test: sender signs in, deposits USDC, copies the link; a new recipient signs in and claims with zero initial USDC; the same sending wallet recovers an unclaimed link in a separate browser and can cancel it.

## Recovery and claim boundaries

Backups are encrypted with AES-256-GCM and bound to chain, escrow, deposit and sending wallet. Only the first-party backup endpoint accepts the secret fragment, verifies the deposit and signer, and encrypts it before storage. Public history omits fragments. Private recovery requires an EIP-191 sender signature bound to origin, chain, escrow and a short-lived timestamp.

The claim fragment is captured into tab storage and removed from the URL before loading Privy. The browser signs the recipient-bound claim. The relay receives only deposit metadata and that signature, verifies the Privy session and embedded recipient, then submits on the recipient's behalf. No recipient gas funding or wallet transaction approval is needed to claim.

The relayer uses a durable Supabase lease to coordinate one pending nonce per funded wallet. It saves signed transaction bytes before broadcasting; retries reuse the same transaction hash. Per-user attempt limits, daily claim counts and a shared daily gas budget fail closed if storage is unavailable. Raw signed transactions contain a recipient-bound signature, never the claim private key.

If broadcasting fails ambiguously, retry the same claim to rebroadcast its saved bytes. A pending or underpriced transaction blocks later claims for that relayer until it is confirmed or resolved by the operator. Never delete a saved job to retry a transaction: retain nonce and hash continuity.

## Checks

Use pnpm typecheck, pnpm lint, pnpm test, pnpm test:contracts and pnpm build. scripts/check-services.mjs performs read-only service checks and reports status codes without printing credentials or user data. Local tests do not replace a live end-to-end check or contract review.

Privy references: https://docs.privy.io/wallets/connectors/ethereum/integrations/wagmi and https://docs.privy.io/authentication/user-authentication/access-tokens.
