"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        if (!token)
            return res.status(401).json({ message: 'No token provided' });
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attach basic user info from token
        const userId = payload.userId;
        const orgId = payload.orgId;
        // fetch user to attach roleId and isAdmin for authorization checks
        const user = await User_1.default.findById(userId).lean();
        if (!user)
            return res.status(401).json({ message: 'Invalid token: user not found' });
        req.user = {
            id: userId,
            orgId,
            roleId: user.roleId,
            isAdmin: user.isAdmin || false,
        };
        return next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}
exports.default = authMiddleware;
