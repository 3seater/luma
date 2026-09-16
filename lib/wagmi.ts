import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { arc } from './arc';
export const config = createConfig({
  chains: [arc],
  transports: { [arc.id]: http(arc.rpcUrls.default.http[0], { timeout: 15000, retryCount: 1 }) },
  ssr: true,
});
