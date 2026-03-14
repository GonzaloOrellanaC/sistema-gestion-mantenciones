"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = markAsRead;
exports.unreadCount = unreadCount;
exports.listNotifications = listNotifications;
const Notification_1 = __importDefault(require("../models/Notification"));
// Notification creation deferred — keep controllers for listing/reading only
async function markAsRead(req, res) {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    const { id } = req.params;
    try {
        const doc = await Notification_1.default.findOneAndUpdate({ _id: id, orgId, userId }, { $set: { read: true } }, { new: true }).lean();
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
        const count = await Notification_1.default.countDocuments({ orgId, userId, read: { $ne: true } });
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
        // support optional userId query for admins; default to authenticated user
        const queryUserId = String(req.query.userId || userId);
        if (req.query.userId && queryUserId !== userId && !req.user?.isAdmin) {
            return res.status(403).json({ message: 'forbidden' });
        }
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
        const skip = (page - 1) * limit;
        const filter = { orgId, userId: queryUserId };
        const [total, docs] = await Promise.all([
            Notification_1.default.countDocuments(filter),
            Notification_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ]);
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const items = (docs || []).map((d) => ({
            _id: d._id,
            orgId: d.orgId,
            userId: d.userId,
            actorId: d.actorId,
            message: d.message,
            meta: d.meta,
            read: !!d.read,
            status: d.read ? 'read' : 'unread',
            createdAt: d.createdAt,
        }));
        return res.json({
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    }
    catch (err) {
        console.error('listNotifications err', err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
// createNotification intentionally removed; notifications planned for later
exports.default = {
    listNotifications,
    unreadCount,
    markAsRead,
};
