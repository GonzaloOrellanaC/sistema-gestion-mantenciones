import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import partsController from '../controllers/partsController';

const router = Router();
router.use(authMiddleware);

router.post('/', partsController.create);
router.get('/', partsController.list);
router.get('/:id', partsController.getOne);
router.put('/:id', partsController.update);
router.delete('/:id', partsController.remove);

export default router;
