import type { Address, Hash } from 'viem';
import { arc, escrowAddress } from './arc';
export type HistoryItem = { id: string; sender: Address; amount: string; hash: Hash };
const storageKey = () => `arc-send:history:${arc.id}:${escrowAddress?.toLowerCase()}`;
export function readHistory(sender: Address): HistoryItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey()) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((item: HistoryItem) => typeof item?.id === 'string' && /^[1-9]\d{0,77}$/.test(item.id) && typeof item.sender === 'string' && item.sender.toLowerCase() === sender.toLowerCase());
  } catch { return []; }
}
export function saveHistory(item: HistoryItem) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey()) || '[]');
    const items: HistoryItem[] = Array.isArray(parsed) ? parsed : [];
    localStorage.setItem(storageKey(), JSON.stringify([item, ...items.filter(entry => entry.id !== item.id)].slice(0, 500)));
    return true;
  } catch { return false; }
}
