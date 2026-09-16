import { expect, it } from 'vitest';
import { requestOrigin } from './request-origin';
it('uses the browser loopback origin during development without allowing arbitrary host overrides', () => {
  expect(requestOrigin('http://localhost:3000', '127.0.0.1:3000', true)).toBe('http://127.0.0.1:3000');
  for (const host of ['evil.example', '127.0.0.1.evil.example', 'localhost@evil.example', null]) {
    expect(requestOrigin('http://localhost:3000', host, true)).toBe('http://localhost:3000');
  }
  expect(requestOrigin('https://luma.example', '127.0.0.1:3000', false)).toBe('https://luma.example');
});
