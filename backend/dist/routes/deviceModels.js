"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const deviceModelsController_1 = __importDefault(require("../controllers/deviceModelsController"));
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.post('/', deviceModelsController_1.default.create);
router.get('/', deviceModelsController_1.default.list);
router.get('/:id', deviceModelsController_1.default.getOne);
router.put('/:id', deviceModelsController_1.default.update);
router.delete('/:id', deviceModelsController_1.default.remove);
exports.default = router;
