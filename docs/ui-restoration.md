# Beam presentation restored for Luma

Compared the original repository components at `3b2cea7` with the Luma rewrite. The original uses Privy (`@privy-io/react-auth` and `@privy-io/wagmi`), not RainbowKit. Its header calls `connectWallet`; recipients retain social sign-in and embedded wallet creation.

Restored the original hero layout and interactive Choose / Share / Claim preview, glass ribbon geometry and reflection, floating step illustrations, animated fingerprint, FAQ hierarchy, ribbon CTA and five-column footer. Adapted the asset content to USDC and the artwork to Luma's blue/sea-glass palette. The approved logo remains unchanged. Removed invented slogans and duplicated explanations from the send wizard.

The header opens Privy's wallet chooser. The connected dropdown restores the compact glass treatment, copy/disconnect actions, recent local links and history shortcut, while retaining embedded-wallet export. Recent links are a local preview; full cross-device recovery remains in Your links.

Real wallet-modal and login verification requires `NEXT_PUBLIC_PRIVY_APP_ID` plus the corresponding Privy dashboard origin configuration. An unconfigured preview disables the connect button. No live wallet transaction was submitted in this UI pass.

Verification: TypeScript, ESLint and production build passed (existing upstream ox/Tempo dynamic import warnings). Browser checks cover interactive preview stages, FAQ expansion, amount/review navigation and mobile overflow; no browser runtime errors observed. Payment, claim and encrypted backup implementations were preserved.
