import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import * as rolesController from '../controllers/rolesController';
import { requirePermission } from '../middleware/authorization';

const router = Router();
router.use(authMiddleware);

// Only users with 'crearRoles' can create roles
router.post('/', requirePermission('crearRoles'), rolesController.create);
router.get('/', rolesController.list);
router.get('/:id', rolesController.getOne);
// Only users with 'editarRoles' can update or delete roles
router.put('/:id', requirePermission('editarRoles'), rolesController.update);
router.delete('/:id', requirePermission('editarRoles'), rolesController.remove);

export default router;
