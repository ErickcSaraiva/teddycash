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

type ErrorNormalizer = (error: unknown) => never;
const offlineNormalizer: ErrorNormalizer = () => { throw new GameApiError('OFFLINE', undefined, 'Sem conexão com o servidor.'); };

export function createGamesApi(transport: GameTransport, normalizeError: ErrorNormalizer = offlineNormalizer) {
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
