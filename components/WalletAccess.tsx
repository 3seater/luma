'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useAuth } from './Auth';
const ReceivingWallet = dynamic(() => import('./ReceivingWallet').then(module => module.ReceivingWallet), { ssr: false });
export function WalletAccess() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <main className="flow-page"><div className="flow-heading"><h1>Your wallet.</h1></div><div className="flow-card wallet-access-card">
    {!auth.ready ? <p role="status">Loading…</p> : !auth.authenticated ? <>
      <p>Sign in with the same account you used to claim your Luma.</p>
      <button className="button full" disabled={!auth.configured} onClick={auth.login}>Sign in to your wallet</button>
    </> : auth.embeddedAddress ? <ReceivingWallet address={auth.embeddedAddress} defaultOpen /> : <>
      <p>Your account is signed in. Open its receiving wallet to continue.</p>
      <button className="button full" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await auth.ensureWallet(); } catch { setError('Could not open your wallet. Please try again.'); } finally { setBusy(false); } }}>{busy ? 'Opening…' : 'Open your wallet'}</button>
    </>}
    {!auth.configured && <p className="notice">Wallet sign-in is not configured yet.</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </div></main>;
}
