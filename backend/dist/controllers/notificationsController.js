"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = markAsRead;
exports.unreadCount = unreadCount;
exports.listNotifications = listNotifications;
const Notification_1 = __importDefault(require("../models/Notification"));
const Notification_2 = __importDefault(require("../models/Notification"));
async function markAsRead(req, res) {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    const { id } = req.params;
    try {
        const doc = await Notification_2.default.findOneAndUpdate({ _id: id, orgId, userId }, { $set: { read: true } }, { new: true }).lean();
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        return res.json(doc);
    }
    catch (e) {
        console.error('markAsRead err', e);
        return res.status(500).json({ message: e.message || 'server error' });
    }
}
async function unreadCount(req, res) {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    try {
        const count = await Notification_2.default.countDocuments({ orgId, userId, read: { $ne: true } });
        return res.json({ count });
    }
    catch (e) {
        console.error('unreadCount err', e);
        return res.status(500).json({ message: e.message || 'server error' });
    }
}
async function listNotifications(req, res) {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    try {
        const docs = await Notification_1.default.find({ orgId, userId }).sort({ createdAt: -1 }).limit(100).lean();
        return res.json({ items: docs });
    }
    catch (err) {
        console.error('listNotifications err', err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
exports.default = {
    listNotifications,
    unreadCount,
    markAsRead,
};
