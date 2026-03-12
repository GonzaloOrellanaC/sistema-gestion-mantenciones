import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import partsController from '../controllers/partsController';

const router = Router();
router.use(authMiddleware);

router.post('/', partsController.create);
router.post('/bulk-create', partsController.bulkCreate);
router.post('/availability', partsController.availability);
router.get('/', partsController.list);
router.get('/:id', partsController.getOne);
router.get('/:id/usage-history', partsController.usageHistory);
router.put('/:id', partsController.update);
router.delete('/:id', partsController.remove);

export default router;
