import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/profileController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.get('/profile', verifyToken, getProfile);
router.patch('/profile', verifyToken, updateProfile);
router.get('/profile/:userId', verifyToken, getProfile);
router.patch('/profile/:userId', verifyToken, updateProfile);
router.post('/profile/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

export default router;
