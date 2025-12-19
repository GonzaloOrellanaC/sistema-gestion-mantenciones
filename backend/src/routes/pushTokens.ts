import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import pushTokensController from '../controllers/pushTokensController';

const router = Router();
router.use(authMiddleware);

router.post('/', pushTokensController.registerToken);

export default router;
