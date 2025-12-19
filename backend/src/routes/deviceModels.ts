import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import deviceModelsController from '../controllers/deviceModelsController';

const router = Router();
router.use(authMiddleware);

router.post('/', deviceModelsController.create);
router.get('/', deviceModelsController.list);
router.get('/:id', deviceModelsController.getOne);
router.put('/:id', deviceModelsController.update);
router.delete('/:id', deviceModelsController.remove);

export default router;
