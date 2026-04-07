import { Router } from 'express';
import devController from '../controllers/devController';

const router = Router();

// POST /api/dev/send-test-email
router.post('/send-test-email', devController.sendTestEmail);

export default router;
