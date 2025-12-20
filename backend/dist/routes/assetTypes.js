"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const assetTypesController_1 = __importDefault(require("../controllers/assetTypesController"));
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.post('/', assetTypesController_1.default.create);
router.get('/', assetTypesController_1.default.list);
router.get('/:id', assetTypesController_1.default.getOne);
router.put('/:id', assetTypesController_1.default.update);
router.delete('/:id', assetTypesController_1.default.remove);
exports.default = router;
