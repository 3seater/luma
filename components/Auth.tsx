'use client';
import { createContext, useContext } from 'react';
import type { Address } from 'viem';
export type AuthState = {
  configured: boolean; ready: boolean; authenticated: boolean; embeddedAddress?: Address;
  login: () => void; logout: () => Promise<void>; connectWallet: () => void;
  requestLogin: () => Promise<boolean>;
  getAccessToken: () => Promise<string | null>; ensureWallet: () => Promise<Address>;
  exportWallet: () => Promise<void>;
};
const unavailable = async (): Promise<never> => { throw new Error('Sign-in is not configured yet.'); };
export const AuthContext = createContext<AuthState>({
  configured: false, ready: false, authenticated: false, login: () => {},
  logout: unavailable, connectWallet: () => {}, getAccessToken: unavailable,
  requestLogin: async () => false,
  ensureWallet: unavailable, exportWallet: unavailable,
});
export const useAuth = () => useContext(AuthContext);
