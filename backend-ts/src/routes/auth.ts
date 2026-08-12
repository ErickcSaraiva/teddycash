import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { loginRateLimit, registerRateLimit } from '../middlewares/securityRateLimit';

const router = Router();

router.post('/auth/login', loginRateLimit, login);
router.post('/auth/register', registerRateLimit, register);

export default router;
