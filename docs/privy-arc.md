# Privy and Arc: verified integration direction

Checked September 16, 2026 against Privy's official documentation.

## Conclusion

Yes: use a standard Privy embedded Ethereum/EVM EOA wallet for Luma. Wallet/key creation is distinct from a blockchain transaction and does not require deploying an account contract on Arc. Configure Arc as a custom EVM network. An existing embedded EVM wallet address can be used on Arc, but its balance and transaction history are chain-specific.

Privy's React documentation explicitly supports any chain with EVM RPC requests, including custom chains via a viem chain definition. Arc transaction compatibility still requires testing native USDC gas/18-decimal value handling against an accessible Arc endpoint. Do not infer funded-wallet readiness, sponsorship, bridging or onramp support from basic EVM-wallet support.

## Recommended user journey

- Sender connects an existing wallet or signs in through Privy, selects USDC, enters an amount, reviews a glass receipt, and confirms the deposit.
- Recipient opens the link, signs in, gets an embedded EVM wallet if needed, and claims to that wallet.
- Use normal EOAs first. ERC-4337 smart accounts, bundlers and paymasters require additional Arc infrastructure and verification.
- A new embedded wallet has no gas. Luma’s implemented relay pays the claim fee when configured and funded. A new recipient does not need initial USDC; later outgoing transfers require gas.

## Integration configuration

Use `@privy-io/react-auth` plus `@privy-io/wagmi` to synchronize embedded and external wallets with the app's wagmi hooks. The relevant PrivyProvider configuration is:

```tsx
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
  config={{
    defaultChain: arc,
    supportedChains: [arc],
    loginMethods: ['apple', 'google', 'twitter', 'wallet'],
    embeddedWallets: { ethereum: { createOnLogin: 'all-users' } },
    appearance: { theme: 'light', accentColor: '#254c6c', walletChainType: 'ethereum-only' },
  }}
>
  {/* QueryClientProvider and @privy-io/wagmi WagmiProvider */}
</PrivyProvider>
```

Enable chosen login providers, embedded Ethereum wallet creation and allowed app origins in the Privy dashboard. Configure an app ID; never use a placeholder ID in production. Verify the current installed SDK's config types when implementing. Integrate the connection UI, authenticated session/logout, active-wallet selection and wallet-ready loading states together; changing only the provider leaves an incomplete flow.

## Current implementation status

Privy provider/auth integration appeared concurrently in this shared checkout during the UI work. It is gated by `NEXT_PUBLIC_PRIVY_APP_ID`; without an app ID, the current UI stays in preview mode. Its connector build compatibility was adjusted to expose the injected connector required by Privy's wagmi adapter. No end-to-end Privy login has been tested in this UI pass. Complete dashboard setup and actual sign-in/transaction tests before advertising the feature as live. The snippet above is integration guidance, not an assertion about all current login settings.

Arc's August 5 announcement schedules public mainnet for September 16, 2026 (the date of this check), but an announcement and a responding RPC do not prove that public production access is fully open. Use Arc Testnet for the first complete sign-in → deposit → claim checks. Keep real transactions gated on the intended network and deployed escrow.

## Sources

- [Privy: configuring EVM networks](https://docs.privy.io/basics/react/advanced/configuring-evm-networks)
- [Privy: chain support and feature-specific availability](https://docs.privy.io/wallets/overview/chains)
- [Privy: embedded wallets](https://docs.privy.io/wallets/overview/embedded)
- [Privy: smart wallets](https://docs.privy.io/wallets/using-wallets/evm-smart-wallets/overview)
- [Arc: public mainnet announcement](https://www.arc.io/blog/arc-mainnet-goes-live-on-september-16-2026)
