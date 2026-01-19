import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as templateTypesController from '../controllers/templateTypesController';

const router = Router();
router.use(authMiddleware);

router.post('/', templateTypesController.create);
router.get('/', templateTypesController.list);

export default router;
