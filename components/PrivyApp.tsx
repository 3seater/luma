'use client';
import { PrivyProvider, usePrivy, useWallets, useLogin } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import type { Address } from 'viem';
import { arc } from '@/lib/arc';
import { config } from '@/lib/wagmi';
import { AuthContext } from './Auth';

function Session({ children }: { children: React.ReactNode }) {
  const privy = usePrivy();
  const { wallets, ready } = useWallets();
  const loginResult = useRef<(success: boolean) => void>();
  const { login } = useLogin({ onComplete: () => { loginResult.current?.(true); loginResult.current = undefined; }, onError: () => { loginResult.current?.(false); loginResult.current = undefined; } });
  const embedded = wallets.find(wallet => wallet.walletClientType === 'privy');
  const snapshot = useRef({ embedded, ready });
  snapshot.current = { embedded, ready };
  const provisioning = useRef<Promise<Address>>();
  async function ensureWallet(): Promise<Address> {
    if (snapshot.current.embedded) return snapshot.current.embedded.address as Address;
    if (provisioning.current) return provisioning.current;
    provisioning.current = (async () => {
      const deadline = Date.now() + 30000;
      while ((!snapshot.current.ready || !snapshot.current.embedded) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 200));
      if (snapshot.current.embedded) return snapshot.current.embedded.address as Address;
      throw new Error('Your wallet is still being prepared. Please try again.');
    })();
    try { return await provisioning.current; } finally { provisioning.current = undefined; }
  }
  return <AuthContext.Provider value={{
    configured: true, ready: privy.ready, authenticated: privy.authenticated,
    embeddedAddress: embedded?.address as Address | undefined,
    login: () => privy.login(), logout: privy.logout, connectWallet: () => privy.connectWallet(),
    requestLogin: () => new Promise(resolve => { loginResult.current?.(false); loginResult.current = resolve; login(); }),
    getAccessToken: privy.getAccessToken, ensureWallet,
    exportWallet: () => privy.exportWallet(embedded ? { address: embedded.address } : undefined),
  }}>{children}</AuthContext.Provider>;
}
export default function PrivyApp({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!} config={{
    loginMethods: ['apple', 'google', 'twitter', 'wallet'],
    embeddedWallets: { ethereum: { createOnLogin: 'all-users' } },
    defaultChain: arc, supportedChains: [arc],
    appearance: { theme: 'light', accentColor: '#254c6c', logo: '/brand/luma-mark.svg',
      landingHeader: 'Sign in to Luma', loginMessage: 'Send and receive USDC with a simple link.', walletChainType: 'ethereum-only' },
  }}><QueryClientProvider client={client}><WagmiProvider config={config}><Session>{children}</Session></WagmiProvider></QueryClientProvider></PrivyProvider>;
}
