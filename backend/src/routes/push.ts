import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import pushController from '../controllers/pushController';

const router = Router();
router.use(authMiddleware);

// POST /api/push/send
router.post('/send', requirePermission('enviarNotificaciones'), pushController.sendPush);

export default router;
