import { Router } from 'express';
import { getBalance, getTransactions, transfer } from '../controllers/accountController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/balance/:userId', verifyToken, getBalance);
router.post('/transfer', verifyToken, transfer);
router.get('/transactions/:userId', verifyToken, getTransactions);

export default router;
