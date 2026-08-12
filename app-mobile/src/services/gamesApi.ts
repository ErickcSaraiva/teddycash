import api, { ApiError } from './api';
import type { GameEvent } from '../games/coinCollectorLogic';

export type GameCatalogItem = {
  id: 'coin-collector'; name: string; duration_ms: number; daily_limit: number;
  maximum_score: number; maximum_reward: number; entry_cost: 0;
};
export type GameSession = {
  id: string; token: string; game_id: string; started_at: string; expires_at: string; status: 'STARTED';
};
export type GameStartResponse = {
  success: true; session: GameSession; entry_cost: 0; daily_remaining: number; teddy_coins: number;
};
export type GameCompleteResponse = {
  success: true;
  session: { id: string; game_id: string; status: 'COMPLETED'; score: number };
  reward: number;
  teddy_coins: number;
  idempotent: boolean;
};
export type CompleteGamePayload = {
  session_id: string; session_token: string; duration_ms: number; score: number; events: GameEvent[];
};

export class GameApiError extends Error {
  constructor(public readonly code: string, public readonly status?: number, message = 'Não foi possível concluir a operação.') {
    super(message);
    this.name = 'GameApiError';
  }
}

export type GameTransport = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
};

const defaultTransport: GameTransport = {
  async get<T>(path: string) { return (await api.get<T>(path)).data; },
  async post<T>(path: string, body?: unknown) { return (await api.post<T>(path, body)).data; },
};

function normalizeError(error: unknown): never {
  if (error instanceof GameApiError) throw error;
  if (error instanceof ApiError) {
    throw new GameApiError(error.code ?? (error.status ? 'SERVER_ERROR' : 'OFFLINE'), error.status, error.message);
  }
  throw new GameApiError('OFFLINE', undefined, 'Sem conexão com o servidor.');
}

export function createGamesApi(transport: GameTransport = defaultTransport) {
  return {
    async list() {
      try { return await transport.get<{ success: true; games: GameCatalogItem[] }>('/games'); }
      catch (error) { return normalizeError(error); }
    },
    async start(gameId: string) {
      try { return await transport.post<GameStartResponse>(`/games/${encodeURIComponent(gameId)}/start`); }
      catch (error) { return normalizeError(error); }
    },
    async complete(gameId: string, payload: CompleteGamePayload) {
      try { return await transport.post<GameCompleteResponse>(`/games/${encodeURIComponent(gameId)}/complete`, payload); }
      catch (error) { return normalizeError(error); }
    },
  };
}

export const gamesApi = createGamesApi();
