import { Router } from 'express';
import { startGame } from '../controllers/gameController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/:gameId/start', verifyToken, startGame);

export default router;
