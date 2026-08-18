import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { getWallet } from '../controllers/walletController';
import { dailyCheckin, dailyCheckinStatus, redeemCredit, rewardCatalog } from '../controllers/rewardController';
import { listTeddyCoinTransactions } from '../controllers/teddyCoinController';
import { rewardRedemptionRateLimit } from '../middlewares/securityRateLimit';

const router = Router();
router.get('/wallet', verifyToken, getWallet);
router.get('/rewards/daily-checkin', verifyToken, dailyCheckinStatus);
router.post('/rewards/daily-checkin', verifyToken, dailyCheckin);
router.get('/rewards/catalog', verifyToken, rewardCatalog);
router.post('/rewards/redeem-credit', verifyToken, rewardRedemptionRateLimit, redeemCredit);
router.get('/teddy-coins/transactions', verifyToken, listTeddyCoinTransactions);
export default router;
