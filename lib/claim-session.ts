const storageKey = 'luma:claim-fragment';
let current = '';
// Run before loading Privy or any other third-party client SDK.
export function captureClaimFragment() {
  if (window.location.pathname !== '/claim') return;
  if (window.location.hash) {
    current = window.location.hash;
    window.history.replaceState(null, '', window.location.pathname);
    try { sessionStorage.setItem(storageKey, current); } catch { /* Memory still works in this tab. */ }
  } else if (!current) {
    try { current = sessionStorage.getItem(storageKey) || ''; } catch { /* Storage is optional. */ }
  }
}
export function readClaimFragment() { return current; }
export function clearClaimFragment() {
  current = '';
  try { sessionStorage.removeItem(storageKey); } catch { /* Already cleared in memory. */ }
}
