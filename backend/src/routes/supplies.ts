import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import suppliesController from '../controllers/suppliesController';

const router = Router();
router.use(authMiddleware);

router.get('/', suppliesController.list);
router.get('/:id', suppliesController.getById);
router.post('/availability', suppliesController.availability);
router.post('/', suppliesController.create);
router.post('/bulk-create', suppliesController.bulkCreate);

export default router;
