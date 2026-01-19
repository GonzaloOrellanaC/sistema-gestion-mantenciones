import { Router } from 'express';
import { getTemplate, saveTemplate } from '../controllers/reportingController';
import authMiddleware from '../middleware/auth';

const router = Router();

router.get('/template', authMiddleware, getTemplate);
router.post('/template', authMiddleware, saveTemplate);

export default router;
