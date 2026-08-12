import { Router } from 'express';
import { completeGame, listGameHistory, listGames, startGame } from '../controllers/gameController';
import { verifyToken } from '../middlewares/authMiddleware';
import { gameCompleteRateLimit, gameReadRateLimit, gameStartRateLimit } from '../middlewares/gameRateLimit';

const router = Router();

router.use(verifyToken);
router.get('/', gameReadRateLimit, listGames);
router.get('/history', gameReadRateLimit, listGameHistory);
router.post('/:gameId/start', gameStartRateLimit, startGame);
router.post('/:gameId/complete', gameCompleteRateLimit, completeGame);

export default router;
