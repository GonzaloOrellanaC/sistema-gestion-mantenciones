"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerToken = registerToken;
const PushToken_1 = __importDefault(require("../models/PushToken"));
async function registerToken(req, res) {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    const { token, platform } = req.body;
    if (!token)
        return res.status(400).json({ message: 'token required' });
    try {
        const doc = await PushToken_1.default.findOneAndUpdate({ orgId, userId, token }, { $set: { platform } }, { upsert: true, new: true });
        return res.json(doc);
    }
    catch (e) {
        console.error('registerToken err', e);
        return res.status(500).json({ message: e.message || 'server error' });
    }
}
exports.default = { registerToken };
