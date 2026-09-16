import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve('next/package.json'));
nextRequire('@next/env').loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
try {
  const id = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const keys = await fetch(`https://auth.privy.io/api/v1/apps/${id}/jwks.json`);
  console.log('Privy verification endpoint:', keys.status);
  const auth = Buffer.from(`${id}:${process.env.PRIVY_APP_SECRET}`).toString('base64');
  const privy = await fetch('https://api.privy.io/v1/users?limit=1', { headers: { Authorization: `Basic ${auth}`, 'privy-app-id': id } });
  console.log('Privy server credentials:', privy.status);
  for (const table of ['beam_link_backups', 'luma_relay_state']) {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } });
    console.log(`Supabase ${table}:`, response.status);
  }
} catch {
  console.error('Service connection check unavailable. No secrets were printed.');
  process.exitCode = 1;
}
