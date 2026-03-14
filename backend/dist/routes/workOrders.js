"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authorization_1 = require("../middleware/authorization");
const workOrdersController_1 = __importDefault(require("../controllers/workOrdersController"));
const files_1 = require("./files");
const router = (0, express_1.Router)();
// allow larger JSON payloads for work-order routes (offline-save may include base64 data URLs)
router.use(express_2.default.json({ limit: '50mb' }));
router.use(auth_1.default);
// Create OT: allow authenticated users (could restrict with permission later)
router.post('/', (0, authorization_1.requirePermission)('asignarOT'), workOrdersController_1.default.createWorkOrder);
// Allow authenticated users to GET their orders; controller enforces permission when requesting all org orders
router.get('/', workOrdersController_1.default.listWorkOrders);
router.get('/:id', workOrdersController_1.default.getWorkOrder);
// Update basic fields on a work order
router.put('/:id', (0, authorization_1.requirePermission)('asignarOT', 'ejecutarOT'), workOrdersController_1.default.updateWorkOrder);
// assign -> requires 'asignarOT'
router.put('/:id/assign', (0, authorization_1.requirePermission)('asignarOT'), workOrdersController_1.default.assignWorkOrder);
// start -> allowed to assignee or supervisor, middleware check minimal; controller checks assignee
router.put('/:id/start', (0, authorization_1.requirePermission)('ejecutarOT'), workOrdersController_1.default.startWorkOrder);
// Save data that was collected offline (IndexedDB) -> merge/apply on server
// Allow the executor/assignee to push offline data (they may not have 'asignarOT')
router.put('/:id/offline-save', (0, authorization_1.requirePermission)('ejecutarOT'), workOrdersController_1.default.offlineSaveWorkOrder);
// submit for review
router.put('/:id/submit-review', workOrdersController_1.default.submitForReview);
// approve/reject -> require 'aprobarRechazar'
router.put('/:id/approve', (0, authorization_1.requirePermission)('aprobarRechazar'), workOrdersController_1.default.approveWorkOrder);
router.put('/:id/reject', (0, authorization_1.requirePermission)('aprobarRechazar'), workOrdersController_1.default.rejectWorkOrder);
// Attach file directly to a work order: multipart/form-data field name = 'file', optional type/workOrderId
router.post('/:id/attachments', files_1.upload.single('file'), workOrdersController_1.default.uploadAttachment);
// Create a public share token for a work order
router.post('/:id/share', (0, authorization_1.requirePermission)('verOT'), workOrdersController_1.default.shareWorkOrder);
exports.default = router;
