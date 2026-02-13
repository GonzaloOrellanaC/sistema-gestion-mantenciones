import { Router } from 'express';
import express from 'express';
import authMiddleware from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import workOrdersController from '../controllers/workOrdersController';
import { upload } from './files';

const router = Router();

// allow larger JSON payloads for work-order routes (offline-save may include base64 data URLs)
router.use(express.json({ limit: '50mb' }));

router.use(authMiddleware);

// Create OT: allow authenticated users (could restrict with permission later)
router.post('/', requirePermission('asignarOT'), workOrdersController.createWorkOrder);
// Allow authenticated users to GET their orders; controller enforces permission when requesting all org orders
router.get('/', workOrdersController.listWorkOrders);
router.get('/:id', workOrdersController.getWorkOrder);
// Update basic fields on a work order
router.put('/:id', requirePermission('asignarOT', 'ejecutarOT'), workOrdersController.updateWorkOrder);

// assign -> requires 'asignarOT'
router.put('/:id/assign', requirePermission('asignarOT'), workOrdersController.assignWorkOrder);

// start -> allowed to assignee or supervisor, middleware check minimal; controller checks assignee
router.put('/:id/start', requirePermission('ejecutarOT'), workOrdersController.startWorkOrder);

// Save data that was collected offline (IndexedDB) -> merge/apply on server
// Allow the executor/assignee to push offline data (they may not have 'asignarOT')
router.put('/:id/offline-save', requirePermission('ejecutarOT'), workOrdersController.offlineSaveWorkOrder);

// submit for review
router.put('/:id/submit-review', workOrdersController.submitForReview);

// approve/reject -> require 'aprobarRechazar'
router.put('/:id/approve', requirePermission('aprobarRechazar'), workOrdersController.approveWorkOrder);
router.put('/:id/reject', requirePermission('aprobarRechazar'), workOrdersController.rejectWorkOrder);

// Attach file directly to a work order: multipart/form-data field name = 'file', optional type/workOrderId
router.post('/:id/attachments', upload.single('file'), workOrdersController.uploadAttachment);
// Create a public share token for a work order
router.post('/:id/share', requirePermission('verOT'), workOrdersController.shareWorkOrder);

export default router;
