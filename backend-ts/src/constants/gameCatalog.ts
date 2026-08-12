export type GameId = 'coin-collector';

export type GameEventType = 'COIN_TAP' | 'OBSTACLE_TAP';

export type GameDefinition = {
  id: GameId;
  name: string;
  durationMs: number;
  minimumDurationMs: number;
  maximumDurationMs: number;
  sessionTtlMs: number;
  dailySessionLimit: number;
  maximumScore: number;
  maximumEvents: number;
  minimumEventIntervalMs: number;
  coinsPerScore: number;
  maximumReward: number;
  active: boolean;
};

function positiveIntegerEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export const GAME_CATALOG = {
  'coin-collector': {
    id: 'coin-collector',
    name: 'Caça às TeddyCoins',
    durationMs: 30_000,
    minimumDurationMs: 28_000,
    maximumDurationMs: 40_000,
    sessionTtlMs: positiveIntegerEnv('GAME_SESSION_TTL_MS', 2 * 60_000),
    dailySessionLimit: positiveIntegerEnv('GAME_DAILY_SESSION_LIMIT', 5),
    maximumScore: 100,
    maximumEvents: 120,
    minimumEventIntervalMs: 80,
    coinsPerScore: 1,
    maximumReward: 50,
    active: true,
  },
} as const satisfies Record<GameId, GameDefinition>;

export function getGameDefinition(gameId: string): GameDefinition | null {
  return Object.prototype.hasOwnProperty.call(GAME_CATALOG, gameId)
    ? GAME_CATALOG[gameId as GameId]
    : null;
}

export function listActiveGames(): GameDefinition[] {
  return Object.values(GAME_CATALOG).filter((game) => game.active);
}
