import { defineChain, isAddress, zeroAddress, type Address, parseAbi } from 'viem';
const testnet = process.env.NEXT_PUBLIC_ARC_NETWORK === 'testnet';
export const arc = defineChain({
  id: (testnet ? 5042002 : 5042) as number,
  name: testnet ? 'Arc Testnet' : 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || (testnet ? 'https://rpc.testnet.arc.io' : 'https://rpc.mainnet.arc.io')] } },
  blockExplorers: { default: { name: 'Arcscan', url: testnet ? 'https://testnet.arc-scan.org' : 'https://arc-scan.org' } },
  testnet,
});
const configuredAddress = process.env.NEXT_PUBLIC_ARC_ESCROW_ADDRESS;
export const escrowAddress: Address | undefined = configuredAddress && isAddress(configuredAddress) && configuredAddress !== zeroAddress
  ? configuredAddress as Address : undefined;
export const escrowAbi = parseAbi([
  'function deposit(address claimSigner) payable returns (uint256)',
  'function claim(uint256 id, address recipient, bytes signature)',
  'function cancel(uint256 id)',
  'function getDeposit(uint256 id) view returns ((address sender, address claimSigner, uint256 amount, uint8 status, uint256 createdAt))',
  'function VERSION() view returns (string)',
  'event Deposited(uint256 indexed id, address indexed sender, address claimSigner, uint256 amount)',
  'event Claimed(uint256 indexed id, address indexed recipient, uint256 amount)',
  'event Cancelled(uint256 indexed id, address indexed sender, uint256 amount)',
  'error InvalidDeposit()', 'error InvalidRecipient()', 'error InvalidSignature()',
  'error NotPending()', 'error NotSender()', 'error TransferFailed()',
]);
export type Deposit = { sender: Address; claimSigner: Address; amount: bigint; status: number; createdAt: bigint };
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;
export const transactionUrl = (hash: string) => `${arc.blockExplorers.default.url}/tx/${hash}`;
