# Arc-only architecture

The browser talks directly to a configured Arc RPC using viem. Wagmi manages injected wallet connections, network switching and optional WalletConnect. Next.js serves the interface; no transaction relay or custody service is running.

`contracts/src/ArcEscrow.sol` accepts native USDC. `lib/arc.ts` contains the chain and human-readable ABI. `lib/links.ts` is the exact offchain encoding of the EIP-191 claim digest. The contract uses `abi.encode`, not packed encoding. `scripts/test-contracts.mjs` verifies the shared encoding against deployed local bytecode.

State transitions: Missing → Pending → Claimed OR Cancelled. Terminal states cannot transition again. Calls use checks/effects/interactions and nonReentrant; failed transfers revert state. The original sender alone can cancel. A relayer may submit a claim, but its recipient cannot differ from the signature.

`Send` checks chain ID, escrow code/version, actual gas estimate and available balance before asking the wallet to deposit. Link creation requires a successful receipt with matching contract, sender, signer and amount. A tab-scoped pending record supports receipt recovery. `Claim` verifies network, contract, signer and status from the full fragment. `History` reads current contract state and offers lookup by ID; local records are never authorization.

No HTTP endpoint accepts link keys. No database stores them. Treat any future analytics, chat widgets, error reporting, CSP changes or third-party scripts on claim/send routes as changes to the secret-exposure model.

Mainnet values follow the user's requested network. Arc docs confirmed chain 5042 but included conflicting access-phase notes at implementation time. Deployment remains an operator task; a missing address fails closed. `VERSION` is a compatibility check, not proof of contract authenticity; operators must independently verify deployment bytecode/source.
