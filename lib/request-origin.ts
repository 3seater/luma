// Next's development server can normalize 127.0.0.1 to localhost internally.
// Keep browser signatures and same-origin checks bound to the actual loopback host.
export function requestOrigin(urlOrigin: string, host: string | null, development: boolean): string {
  if (development && host && /^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(host)) {
    return `${new URL(urlOrigin).protocol}//${host}`;
  }
  return urlOrigin;
}
