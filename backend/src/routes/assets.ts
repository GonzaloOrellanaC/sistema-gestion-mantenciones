import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import assetsController from '../controllers/assetsController';

const router = Router();
router.use(authMiddleware);

router.post('/', assetsController.create);
router.get('/', assetsController.list);
router.get('/:id', assetsController.getOne);
router.put('/:id', assetsController.update);
router.delete('/:id', assetsController.remove);

export default router;
