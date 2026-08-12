import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { privacyReadRateLimit, privacySensitiveRateLimit } from '../middlewares/securityRateLimit';
import { cancelDeletion, confirmDeletion, privacyOverview, requestDeletion, requestExport, updateConsent } from '../controllers/privacyController';

const router = Router();
router.use('/privacy', verifyToken);
router.get('/privacy', privacyReadRateLimit, privacyOverview);
router.post('/privacy/requests/export', privacySensitiveRateLimit, requestExport);
router.post('/privacy/requests/deletion', privacySensitiveRateLimit, requestDeletion);
router.post('/privacy/requests/:requestId/confirm', privacySensitiveRateLimit, confirmDeletion);
router.post('/privacy/requests/:requestId/cancel', privacySensitiveRateLimit, cancelDeletion);
router.put('/privacy/consents', privacySensitiveRateLimit, updateConsent);
export default router;
