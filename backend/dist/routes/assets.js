"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const assetsController_1 = __importDefault(require("../controllers/assetsController"));
const router = (0, express_1.Router)();
router.use(auth_1.default);
router.post('/', assetsController_1.default.create);
router.get('/', assetsController_1.default.list);
router.get('/:id', assetsController_1.default.getOne);
router.put('/:id', assetsController_1.default.update);
router.delete('/:id', assetsController_1.default.remove);
exports.default = router;
