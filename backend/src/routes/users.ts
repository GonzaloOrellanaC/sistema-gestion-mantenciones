import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as usersController from '../controllers/usersController';

const router = Router();

// All routes require auth; admin/front-end will control who can create
router.use(authMiddleware);

router.post('/', usersController.create); // create user in same org as requester
router.get('/', usersController.list);
router.get('/:id', usersController.getOne);
router.put('/:id', usersController.update);
router.delete('/:id', usersController.remove);

export default router;
