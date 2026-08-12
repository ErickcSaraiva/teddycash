import { isAxiosError } from 'axios';
import api from './api';

export type TeddyCoinTransactionType =
  | 'CREDIT_PURCHASE_REWARD' | 'DAILY_CHECKIN' | 'GAME_ENTRY'
  | 'GAME_REWARD' | 'CREDIT_REDEMPTION' | 'ADMIN_ADJUSTMENT';

export type Wallet = { credits: number; teddy_coins: number };
export type CheckinResponse = { success: true; reward: 10; teddy_coins: number; checked_in_at: string; next_checkin_at: string };
export type CheckinAlreadyClaimed = { success: false; code: 'CHECKIN_ALREADY_CLAIMED'; message: string; next_checkin_at: string };
export type TeddyCoinTransaction = { id: string; type: TeddyCoinTransactionType; amount: number; balance_after: number; reference_id: string | null; description: string | null; created_at: string };
export type TeddyCoinHistory = { items: TeddyCoinTransaction[]; page: number; limit: number; total: number; totalPages: number };

export async function getWallet() { return (await api.get<Wallet>('/wallet')).data; }
export async function claimDailyCheckin() { return (await api.post<CheckinResponse>('/rewards/daily-checkin')).data; }
export async function getTeddyCoinTransactions(page = 1, limit = 20) { return (await api.get<TeddyCoinHistory>('/teddy-coins/transactions', { params: { page, limit } })).data; }

export function getApiError<T>(error: unknown): T | null {
  return isAxiosError(error) ? (error.response?.data as T | undefined) ?? null : null;
}
