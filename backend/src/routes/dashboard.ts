import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import dashboardController from '../controllers/dashboardController';

const router = Router();

router.use(authMiddleware);

// GET /api/dashboard/counts
router.get('/counts', dashboardController.counts);

export default router;
