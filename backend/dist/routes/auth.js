"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const validator_1 = __importDefault(require("validator"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authController = __importStar(require("../controllers/authController"));
const router = (0, express_1.Router)();
const forgotLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 5, message: 'Too many password reset requests, try later.' });
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', forgotLimiter, async (req, res, next) => {
    // basic validation before controller: email format
    const { email } = req.body;
    if (email && !validator_1.default.isEmail(email))
        return res.status(400).json({ message: 'Invalid email' });
    return authController.forgotPassword(req, res);
});
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', auth_1.default, authController.changePassword);
router.post('/change-password-admin', auth_1.default, authController.changePasswordAdmin);
// Get current authenticated user
router.get('/me', auth_1.default, (req, res, next) => authController.me(req, res));
exports.default = router;
