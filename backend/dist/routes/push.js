"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const authorization_1 = require("../middleware/authorization");
const pushController_1 = __importDefault(require("../controllers/pushController"));
const router = (0, express_1.Router)();
router.use(auth_1.default);
// POST /api/push/send
router.post('/send', (0, authorization_1.requirePermission)('enviarNotificaciones'), pushController_1.default.sendPush);
exports.default = router;
