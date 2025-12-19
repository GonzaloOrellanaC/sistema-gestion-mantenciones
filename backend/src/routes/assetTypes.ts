import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import assetTypesController from '../controllers/assetTypesController';

const router = Router();
router.use(authMiddleware);

router.post('/', assetTypesController.create);
router.get('/', assetTypesController.list);
router.get('/:id', assetTypesController.getOne);
router.put('/:id', assetTypesController.update);
router.delete('/:id', assetTypesController.remove);

export default router;
