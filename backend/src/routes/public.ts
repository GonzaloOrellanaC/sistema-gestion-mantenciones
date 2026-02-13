import { Router } from 'express';
import publicController from '../controllers/publicController';

const router = Router();

// GET /public/work-orders/:token
router.get('/work-orders/:token', publicController.getWorkOrderByToken);

export default router;
