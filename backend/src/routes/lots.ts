import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import lotsController from '../controllers/lotsController';

const router = Router();
router.use(authMiddleware);

router.get('/', lotsController.list);
router.get('/:id', lotsController.getById);
router.put('/:id', lotsController.update);
router.delete('/:id', lotsController.remove);

export default router;
