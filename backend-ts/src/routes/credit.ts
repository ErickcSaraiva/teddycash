import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { addCredit } from '../controllers/userController';

const router = Router();

router.post('/users/credit', verifyToken, addCredit);

export default router;
