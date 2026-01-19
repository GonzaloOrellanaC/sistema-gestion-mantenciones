import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import notificationsController from '../controllers/notificationsController';

const router = Router();

router.use(authMiddleware);

// GET /api/notifications
router.get('/', notificationsController.listNotifications);
router.get('/unread-count', notificationsController.unreadCount);
router.put('/:id/read', notificationsController.markAsRead);
// POST notifications is planned but disabled for now

export default router;
