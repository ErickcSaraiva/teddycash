import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import {
  createMachineAuthorization,
  getBalance,
  getTransactions,
  redeemMachineAuthorization,
  transfer,
} from '../controllers/accountController';

const router = Router();

router.get('/balance/:userId', verifyToken, getBalance);
router.post('/transfer', verifyToken, transfer);
router.get('/transactions/:userId', verifyToken, getTransactions);

router.post('/machine-authorizations', verifyToken, createMachineAuthorization);
router.post('/machine-authorizations/redeem', verifyToken, redeemMachineAuthorization);

export default router;