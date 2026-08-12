export const COIN_COLLECTOR_DURATION_MS = 30_000;
export const MINIMUM_TAP_INTERVAL_MS = 80;
export const TARGET_SIZE = 68;
export const MAXIMUM_SCORE = 100;
export const MAXIMUM_EVENTS = 120;

export type TargetKind = 'REWARD' | 'OBSTACLE';
export type Target = { id: number; kind: TargetKind; emoji: string; x: number; y: number };
export type GameEvent = { sequence: number; type: 'COIN_TAP' | 'OBSTACLE_TAP'; occurred_at_ms: number };

const rewards = ['🪙', '🧸'];
const obstacles = ['🐝', '☁️'];

export function createTarget(random: () => number, width: number, height: number, id: number): Target {
  const kind: TargetKind = random() < 0.75 ? 'REWARD' : 'OBSTACLE';
  const choices = kind === 'REWARD' ? rewards : obstacles;
  return {
    id,
    kind,
    emoji: choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))],
    x: Math.floor(random() * Math.max(1, width - TARGET_SIZE)),
    y: Math.floor(random() * Math.max(1, height - TARGET_SIZE)),
  };
}

export function registerTap(score: number, events: GameEvent[], target: Target, occurredAtMs: number) {
  if (events.length >= MAXIMUM_EVENTS || (target.kind === 'REWARD' && score >= MAXIMUM_SCORE)) return { accepted: false, score, events };
  const lastTime = events.at(-1)?.occurred_at_ms ?? -MINIMUM_TAP_INTERVAL_MS;
  if (occurredAtMs - lastTime < MINIMUM_TAP_INTERVAL_MS) return { accepted: false, score, events };
  const event: GameEvent = {
    sequence: events.length + 1,
    type: target.kind === 'REWARD' ? 'COIN_TAP' : 'OBSTACLE_TAP',
    occurred_at_ms: Math.max(0, Math.floor(occurredAtMs)),
  };
  return {
    accepted: true,
    score: target.kind === 'REWARD' ? score + 1 : Math.max(0, score - 1),
    events: [...events, event],
  };
}

export function remainingSeconds(startedAtMs: number, nowMs: number) {
  return Math.max(0, Math.ceil((COIN_COLLECTOR_DURATION_MS - (nowMs - startedAtMs)) / 1000));
}
