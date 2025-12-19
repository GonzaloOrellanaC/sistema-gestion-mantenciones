import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import brandsController from '../controllers/brandsController';

const router = Router();
router.use(authMiddleware);

router.post('/', brandsController.create);
router.get('/', brandsController.list);
router.get('/:id', brandsController.getOne);
router.put('/:id', brandsController.update);
router.delete('/:id', brandsController.remove);

export default router;
