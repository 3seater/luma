import { isAddress, zeroAddress, type Address, type Hex } from 'viem';
export type RelayPayload = { chainId: number; escrow: Address; depositId: string; recipientAddress: Address; signature: Hex };
export function parseRelayPayload(value: unknown, chainId: number, escrow: Address): RelayPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid claim request.');
  const data = value as Record<string, unknown>;
  const allowed = ['chainId', 'escrow', 'depositId', 'recipientAddress', 'signature'];
  if (Object.keys(data).length !== allowed.length || Object.keys(data).some(key => !allowed.includes(key))) throw new Error('Invalid claim fields.');
  if (data.chainId !== chainId || typeof data.escrow !== 'string' || data.escrow.toLowerCase() !== escrow.toLowerCase()) throw new Error('Wrong claim network or escrow.');
  if (typeof data.depositId !== 'string' || !/^[1-9]\d{0,77}$/.test(data.depositId) || BigInt(data.depositId) >= 2n ** 256n) throw new Error('Invalid deposit ID.');
  if (typeof data.recipientAddress !== 'string' || !isAddress(data.recipientAddress) || data.recipientAddress === zeroAddress || data.recipientAddress.toLowerCase() === escrow.toLowerCase()) throw new Error('Invalid recipient.');
  if (typeof data.signature !== 'string' || !/^0x[0-9a-fA-F]{130}$/.test(data.signature)) throw new Error('Invalid signature.');
  return data as RelayPayload;
}
