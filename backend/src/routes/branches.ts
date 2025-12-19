import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as branchesController from '../controllers/branchesController';

const router = Router();

router.use(authMiddleware);

router.post('/', branchesController.create);
router.get('/', branchesController.list);
router.get('/:id', branchesController.getOne);
router.put('/:id', branchesController.update);
router.delete('/:id', branchesController.remove);

export default router;
