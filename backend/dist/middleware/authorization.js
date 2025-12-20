"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const Role_1 = __importDefault(require("../models/Role"));
// Simple permission middleware. Permission names match keys inside Role.permissions
function requirePermission(permission) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user)
                return res.status(401).json({ message: 'Unauthorized' });
            // Admin bypasses permissions
            if (user.isAdmin)
                return next();
            const roleId = user.roleId;
            if (!roleId)
                return res.status(403).json({ message: 'Forbidden - no role assigned' });
            const role = await Role_1.default.findById(roleId).lean();
            if (!role)
                return res.status(403).json({ message: 'Forbidden - role not found' });
            const perms = role.permissions || {};
            if (perms[permission])
                return next();
            return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
        }
        catch (err) {
            console.error('permission middleware error', err);
            return res.status(500).json({ message: 'Server error' });
        }
    };
}
exports.default = requirePermission;
