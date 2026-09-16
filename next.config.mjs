import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const wagmiRequire = createRequire(require.resolve('wagmi/package.json'));
const coreConnectorsModule = wagmiRequire.resolve('@wagmi/core');
/** @type {import('next').NextConfig} */
const config = {
  distDir: process.env.ARC_BUILD_DIR || (process.env.NODE_ENV === 'development' ? '.next-dev' : '.next'),
  webpack(config) {
    // Privy's wagmi adapter needs the real injected connector. Resolve it from
    // wagmi core without importing unrelated payment SDKs through the barrel.
    config.resolve.alias['wagmi/connectors$'] = coreConnectorsModule;
    // Luma supports Ethereum wallets only; this optional Solana-only peer is unused.
    config.resolve.alias['@farcaster/mini-app-solana'] = false;
    return config;
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};
export default config;
