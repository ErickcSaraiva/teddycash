import api, { ApiError } from './api';
import {
  createGamesApi, GameApiError, type GameTransport,
} from './gamesApiCore';

export * from './gamesApiCore';

const transport: GameTransport = {
  async get<T>(path: string) { return (await api.get<T>(path)).data; },
  async post<T>(path: string, body?: unknown) { return (await api.post<T>(path, body)).data; },
};

function normalizeError(error: unknown): never {
  if (error instanceof GameApiError) throw error;
  if (error instanceof ApiError) throw new GameApiError(error.code ?? (error.status ? 'SERVER_ERROR' : 'OFFLINE'), error.status, error.message);
  throw new GameApiError('OFFLINE', undefined, 'Sem conexão com o servidor.');
}

export const gamesApi = createGamesApi(transport, normalizeError);

/** @deprecated Tela antiga não montada; mantido para compatibilidade de compilação. */
export function submitGameScore() {
  return gamesApi.start('coin-collector');
}
