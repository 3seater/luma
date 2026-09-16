# Luma architecture

Luma sends native USDC on Arc through private claim links. Next.js serves the interface and first-party backup and claim-relay endpoints. Privy provides wallet connection, social sign-in and embedded EVM wallets; its wagmi adapter synchronizes wallet state. Viem handles RPC and contract interaction.

## Escrow and send

`contracts/src/ArcEscrow.sol` accepts native USDC in 18-decimal units. `lib/arc.ts` defines the configured chain and ABI. `lib/links.ts` encodes the EIP-191 claim digest with `abi.encode` semantics, bound to chain, escrow, deposit and recipient.

State transitions are Missing → Pending → Claimed or Cancelled. Only the original sender can cancel a pending deposit. Reentrancy protection and checks/effects/interactions protect payouts; failed transfers revert state. There is no administrator, upgrade mechanism or application fee.

`Send` checks network, escrow code/version, gas estimate and balance before requesting a deposit. Link creation requires a successful matching receipt. A tab-scoped pending record allows receipt recovery without another deposit. A successful deposit triggers an encrypted backup attempt; failure is shown so the sender can keep a copy and retry.

## Backups and recovery

`/api/beams` is a retained internal route name, not Beam product branding. The POST endpoint receives the claim fragment, validates its signer and deposit, and encrypts it with AES-256-GCM before storage in Supabase. Metadata includes chain/escrow scope, sending wallet, deposit ID and creation time. Server-held encryption keys allow the backend to decrypt records; this is not end-to-end encryption.

Public history responses omit secrets. Private recovery requires a timestamped EIP-191 signature from the sending wallet, bound to the request origin, chain and escrow. The same sending wallet can recover successful backups across devices. Local history alone grants no recovery authority. There is no automated backup deletion or self-service deletion endpoint in the current implementation.

## Claim and sponsorship

Before Privy loads, the claim fragment is captured into tab storage and removed from the URL. The browser validates the deposit and signs a recipient-bound claim using the link key. The recipient signs in through Privy and claims to their embedded EVM wallet.

`/api/relay/claim` receives an access token, deposit metadata and the recipient-bound signature, never the claim key. It verifies the authenticated embedded recipient and uses a funded relayer to submit the claim. Supabase stores durable relay jobs, account-based limits and coordination state. The recipient needs no initial USDC for this sponsored claim; later outgoing transfers require gas.

## Deployment and data boundaries

Without service credentials and a deployed escrow, the interface remains a preview and affected operations fail closed. See [service setup](service-setup.md). A configured address or contract version string is not proof of deployment authenticity; verify bytecode/source and test the complete Arc flow before release.

Only the first-party encrypted backup endpoint accepts claim secrets. Do not send them to RPC, Privy, relay requests, logs or analytics. Hosting and authentication providers can still receive request/session metadata. Changes to third-party scripts or telemetry on send/claim pages require reviewing this exposure boundary.
