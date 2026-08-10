import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { verifyMachine } from '../middlewares/machineAuthMiddleware';
import {
  createMachineAuthorization,
  getMachineAuthorization,
  getBalance,
  getTransactions,
  redeemMachineAuthorization,
} from '../controllers/accountController';

const router = Router();

router.get('/balance/:userId', verifyToken, getBalance);
router.get('/transactions/:userId', verifyToken, getTransactions);

router.post('/machine-authorizations', verifyToken, createMachineAuthorization);
router.get('/machine-authorizations/:authorizationId', verifyToken, getMachineAuthorization);
router.post('/machine-authorizations/redeem', verifyMachine, redeemMachineAuthorization);

export default router;
