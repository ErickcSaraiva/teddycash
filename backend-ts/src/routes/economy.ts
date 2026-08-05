import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { getWallet } from '../controllers/walletController';
import { dailyCheckin, redeemCreditReward } from '../controllers/rewardController';
import { listTeddyCoinTransactions } from '../controllers/teddyCoinController';

const router = Router();
router.get('/wallet', verifyToken, getWallet);
router.post('/rewards/daily-checkin', verifyToken, dailyCheckin);
router.post('/rewards/redeem-credit', verifyToken, redeemCreditReward);
router.get('/teddy-coins/transactions', verifyToken, listTeddyCoinTransactions);
export default router;
