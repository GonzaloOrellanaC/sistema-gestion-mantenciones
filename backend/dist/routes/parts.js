"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const partsController_1 = __importDefault(require("../controllers/partsController"));
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.post('/', partsController_1.default.create);
router.post('/bulk-create', partsController_1.default.bulkCreate);
router.post('/availability', partsController_1.default.availability);
router.get('/', partsController_1.default.list);
router.get('/:id', partsController_1.default.getOne);
router.get('/:id/usage-history', partsController_1.default.usageHistory);
router.put('/:id', partsController_1.default.update);
router.delete('/:id', partsController_1.default.remove);
exports.default = router;
