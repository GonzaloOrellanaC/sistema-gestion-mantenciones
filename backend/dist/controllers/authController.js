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
exports.register = register;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.changePassword = changePassword;
exports.changePasswordAdmin = changePasswordAdmin;
exports.me = me;
const authService = __importStar(require("../services/authService"));
const User_1 = __importDefault(require("../models/User"));
const Role_1 = __importDefault(require("../models/Role"));
const Organization_1 = __importDefault(require("../models/Organization"));
async function register(req, res) {
    try {
        const result = await authService.registerUser(req.body);
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function login(req, res) {
    try {
        const result = await authService.loginUser(req.body);
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function forgotPassword(req, res) {
    try {
        await authService.forgotPassword(req.body);
        return res.json({ message: 'If the email exists, a reset link will be sent' });
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function resetPassword(req, res) {
    try {
        await authService.resetPassword(req.body);
        return res.json({ message: 'Password updated successfully' });
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function changePassword(req, res) {
    try {
        const userId = req.user.id;
        await authService.changePassword(userId, req.body);
        return res.json({ message: 'Password changed successfully' });
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function changePasswordAdmin(req, res) {
    try {
        const requesterId = req.user.id;
        await authService.changePasswordAdmin(requesterId, req.body);
        return res.json({ message: 'Password updated for user' });
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function me(req, res) {
    try {
        const userId = req.user.id;
        const user = await User_1.default.findById(userId).select('-passwordHash');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // include role info if available
        let roleData = null;
        try {
            if (user.roleId) {
                const role = await Role_1.default.findById(user.roleId).lean();
                if (role)
                    roleData = { id: role._id, name: role.name, permissions: role.permissions || {} };
            }
        }
        catch (e) {
            // ignore role lookup errors
        }
        // include organization info
        let orgData = null;
        try {
            if (user.orgId) {
                const org = await Organization_1.default.findById(user.orgId).lean();
                if (org)
                    orgData = { id: org._id, name: org.name, trialStartsAt: org.trialStartsAt, trialEndsAt: org.trialEndsAt, isPaid: org.isPaid };
            }
        }
        catch (e) {
            // ignore org lookup errors
        }
        return res.json({ id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName, orgId: user.orgId, org: orgData, isAdmin: user.isAdmin, role: roleData });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}
exports.default = {
    register,
    login,
    forgotPassword,
    resetPassword,
    changePassword,
    changePasswordAdmin
};
