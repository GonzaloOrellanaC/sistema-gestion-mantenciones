"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const notificationsController_1 = __importDefault(require("../controllers/notificationsController"));
const router = (0, express_1.Router)();
router.use(auth_1.default);
// GET /api/notifications
router.get('/', notificationsController_1.default.listNotifications);
router.get('/unread-count', notificationsController_1.default.unreadCount);
router.put('/:id/read', notificationsController_1.default.markAsRead);
exports.default = router;
