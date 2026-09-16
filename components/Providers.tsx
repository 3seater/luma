'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { arc } from '@/lib/arc';
import { captureClaimFragment } from '@/lib/claim-session';
const PrivyApp = dynamic(() => import('./PrivyApp'), { ssr: false });
const previewConfig = createConfig({ chains: [arc], connectors: [], transports: { [arc.id]: http() }, ssr: true });
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const [safeToLoad, setSafeToLoad] = useState(false);
  useEffect(() => {
    captureClaimFragment();
    window.addEventListener('hashchange', captureClaimFragment);
    setSafeToLoad(true);
    return () => window.removeEventListener('hashchange', captureClaimFragment);
  }, []);
  if (process.env.NEXT_PUBLIC_PRIVY_APP_ID) return safeToLoad ? <PrivyApp>{children}</PrivyApp> : null;
  return <QueryClientProvider client={client}><WagmiProvider config={previewConfig}>{children}</WagmiProvider></QueryClientProvider>;
}
