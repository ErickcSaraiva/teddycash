import { isAxiosError } from 'axios';
import api from './api';
import { createCheckinApi } from './checkinApiCore';
export type { CheckinState } from './checkinApiCore';

export type TeddyCoinTransactionType =
  | 'CREDIT_PURCHASE_REWARD' | 'DAILY_CHECKIN' | 'GAME_ENTRY'
  | 'GAME_REWARD' | 'CREDIT_REDEMPTION' | 'ADMIN_ADJUSTMENT';

export type Wallet = { credits: number; teddy_coins: number };
export type TeddyCoinTransaction = { id: string; type: TeddyCoinTransactionType; source: string; amount: number; balance_after: number; reference_id: string | null; description: string | null; created_at: string };
export type TeddyCoinHistory = { items: TeddyCoinTransaction[]; page: number; limit: number; total: number; totalPages: number };

export async function getWallet() { return (await api.get<Wallet>('/wallet')).data; }
const checkinApi = createCheckinApi({
  async get<T>(path: string) { return (await api.get<T>(path)).data; },
  async post<T>(path: string) { return (await api.post<T>(path)).data; },
});
export const getDailyCheckinStatus = checkinApi.getStatus;
export const claimDailyCheckin = checkinApi.claim;
export async function getTeddyCoinTransactions(page = 1, limit = 20) { return (await api.get<TeddyCoinHistory>('/teddy-coins/transactions', { params: { page, limit } })).data; }

export function getApiError<T>(error: unknown): T | null {
  return isAxiosError(error) ? (error.response?.data as T | undefined) ?? null : null;
}
