import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import {
  createPixPaymentOrder,
  getCreditPackages,
  getPaymentOrder,
  listPaymentOrders,
} from '../controllers/paymentController';

const router = Router();

router.get('/credit-packages', verifyToken, getCreditPackages);
router.post('/payment-orders/pix', verifyToken, createPixPaymentOrder);
router.get('/payment-orders/:orderId', verifyToken, getPaymentOrder);
router.get('/payment-orders', verifyToken, listPaymentOrders);

export default router;
