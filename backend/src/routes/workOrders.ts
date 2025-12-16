import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import workOrdersController from '../controllers/workOrdersController';
import { upload } from './files';

const router = Router();

router.use(authMiddleware);

// Create OT: allow authenticated users (could restrict with permission later)
router.post('/', requirePermission('asignarOT'), workOrdersController.createWorkOrder);
// Allow authenticated users to GET their orders; controller enforces permission when requesting all org orders
router.get('/', workOrdersController.listWorkOrders);
router.get('/:id', workOrdersController.getWorkOrder);

// assign -> requires 'asignarOT'
router.put('/:id/assign', requirePermission('asignarOT'), workOrdersController.assignWorkOrder);

// start -> allowed to assignee or supervisor, middleware check minimal; controller checks assignee
router.put('/:id/start', workOrdersController.startWorkOrder);

// submit for review
router.put('/:id/submit-review', workOrdersController.submitForReview);

// approve/reject -> require 'aprobarRechazar'
router.put('/:id/approve', requirePermission('aprobarRechazar'), workOrdersController.approveWorkOrder);
router.put('/:id/reject', requirePermission('aprobarRechazar'), workOrdersController.rejectWorkOrder);

// Attach file directly to a work order: multipart/form-data field name = 'file', optional type/workOrderId
router.post('/:id/attachments', upload.single('file'), workOrdersController.uploadAttachment);

export default router;
