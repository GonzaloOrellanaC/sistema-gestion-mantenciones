"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../middleware/auth"));
const dashboardController_1 = __importDefault(require("../controllers/dashboardController"));
const router = (0, express_1.Router)();
router.use(auth_1.default);
// GET /api/dashboard/counts
router.get('/counts', dashboardController_1.default.counts);
exports.default = router;
