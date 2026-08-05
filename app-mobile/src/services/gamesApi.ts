// Compatibilidade para imports antigos. Identidade e custo são definidos no backend.
import { startGame } from './economyApi';
export { startGame };

/** @deprecated Use startGame(gameId). Kept only for the legacy, unmounted screen. */
export function submitGameScore(_userId: string, _earnedCoins: number) {
  return startGame('quick-tap');
}
