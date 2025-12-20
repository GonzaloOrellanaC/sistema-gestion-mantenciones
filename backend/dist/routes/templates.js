"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const templatesController_1 = __importDefault(require("../controllers/templatesController"));
const authorization_1 = require("../middleware/authorization");
const router = (0, express_1.Router)();
// All template operations require authentication and are scoped to the user's org
router.use(auth_1.default);
// Permissions: create -> 'crearPautas', view -> 'verPautas', edit/delete -> 'editarPautas'
router.post('/', (0, authorization_1.requirePermission)('crearPautas'), templatesController_1.default.createTemplate);
router.get('/', (0, authorization_1.requirePermission)('verPautas'), templatesController_1.default.listTemplates);
router.get('/:id', (0, authorization_1.requirePermission)('verPautas'), templatesController_1.default.getTemplate);
router.get('/:id/preview', (0, authorization_1.requirePermission)('verPautas'), templatesController_1.default.previewTemplate);
router.put('/:id', (0, authorization_1.requirePermission)('editarPautas'), templatesController_1.default.updateTemplate);
router.delete('/:id', (0, authorization_1.requirePermission)('editarPautas'), templatesController_1.default.deleteTemplate);
exports.default = router;
