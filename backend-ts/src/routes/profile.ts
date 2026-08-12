import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { getProfile, updateProfile } from '../controllers/profileController';

const router = Router();

router.get('/profile', verifyToken, getProfile);
router.patch('/profile', verifyToken, updateProfile);
router.get('/profile/:userId', verifyToken, getProfile);
router.patch('/profile/:userId', verifyToken, updateProfile);

export default router;
