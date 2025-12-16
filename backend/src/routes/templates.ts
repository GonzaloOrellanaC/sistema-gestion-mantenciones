import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import templatesController from '../controllers/templatesController';
import { requirePermission } from '../middleware/authorization';

const router = Router();

// All template operations require authentication and are scoped to the user's org
router.use(authMiddleware);

// Permissions: create -> 'crearPautas', view -> 'verPautas', edit/delete -> 'editarPautas'
router.post('/', requirePermission('crearPautas'), templatesController.createTemplate);
router.get('/', requirePermission('verPautas'), templatesController.listTemplates);
router.get('/:id', requirePermission('verPautas'), templatesController.getTemplate);
router.get('/:id/preview', requirePermission('verPautas'), templatesController.previewTemplate);
router.put('/:id', requirePermission('editarPautas'), templatesController.updateTemplate);
router.delete('/:id', requirePermission('editarPautas'), templatesController.deleteTemplate);

export default router;
