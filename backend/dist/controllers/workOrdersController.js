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
const workOrdersService_1 = __importDefault(require("../services/workOrdersService"));
const workOrderStates_1 = require("../utils/workOrderStates");
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
const Role_1 = __importDefault(require("../models/Role"));
const mailer_1 = require("../utils/mailer");
const FileMeta_1 = __importDefault(require("../models/FileMeta"));
const Notification_1 = __importDefault(require("../models/Notification"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function uploadAttachment(req, res) {
    const orgId = req.user?.orgId;
    const { id } = req.params;
    if (!orgId) {
        res.status(400).json({ message: 'orgId missing' });
    }
    else {
        try {
            if (!req.file)
                return res.status(400).json({ message: 'No file uploaded' });
            // ensure work order exists and belongs to org
            const wo = await workOrdersService_1.default.findById(orgId.toString(), id);
            if (!wo)
                return res.status(404).json({ message: 'WorkOrder not found' });
            // store metadata
            const meta = await FileMeta_1.default.create({
                orgId: orgId.toString(),
                uploaderId: req.user?.id,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                storage: 'local',
                path: req.file.path,
                meta: { attachedTo: 'workOrder', workOrderId: id }
            });
            // compute public URL if file stored under ./files
            try {
                const filesBase = path_1.default.join(process.cwd(), 'files');
                const rel = path_1.default.relative(filesBase, req.file.path).replace(/\\/g, '/');
                const publicUrl = `${req.protocol}://${req.get('host')}/files/${rel}`;
                // update meta with public url
                meta.url = publicUrl;
                await meta.save();
            }
            catch (e) {
                // ignore
            }
            // attach to work order
            await WorkOrder_1.default.findOneAndUpdate({ _id: id, orgId: orgId.toString() }, { $push: { attachments: meta._id } }, { new: true });
            // fetch populated work order
            const populated = await workOrdersService_1.default.findById(orgId.toString(), id);
            // emit socket to assignee if exists else to uploader
            const io = getIo(req);
            const target = (wo.assigneeId && wo.assigneeId.toString()) || req.user?.id;
            io && io.to(`user:${target}`).emit('workOrder.attachmentAdded', { workOrder: populated, file: meta });
            return res.json({ workOrder: populated, file: meta });
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: err.message || 'server error' });
        }
    }
}
function getIo(req) {
    return req.app.get('io');
}
async function createWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    try {
        const doc = await workOrdersService_1.default.createWorkOrder(orgId.toString(), req.body, req.user?.id);
        // emit socket event to creator
        const io = getIo(req);
        io && io.to(`user:${req.user?.id}`).emit('workOrder.created', doc);
        return res.status(201).json(doc);
    }
    catch (err) {
        console.error(err);
        if (err && err.status)
            return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function listWorkOrders(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    try {
        // Accept query params: page, limit, assigneeId, state, etc.
        const q = req.query || {};
        // If no explicit assigneeId filter is provided, only allow supervisors/admins to list all org orders
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: 'Unauthorized' });
        if (!user.isAdmin) {
            if (!user.roleId)
                return res.status(403).json({ message: 'Forbidden - no role assigned' });
            const role = await Role_1.default.findById(user.roleId).lean();
            console.log({ role });
            const perms = role?.permissions || {};
            if (!perms['ejecutarOT'])
                return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
        }
        const result = await workOrdersService_1.default.list(orgId.toString(), q);
        return res.json(result);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function getWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    try {
        const doc = await workOrdersService_1.default.findById(orgId?.toString(), id);
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        return res.json(doc);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function assignWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    const { assigneeId, note } = req.body;
    try {
        const wo = await workOrdersService_1.default.assign(orgId?.toString(), id, assigneeId, req.user?.id, note);
        if (!wo)
            return res.status(404).json({ message: 'Not found' });
        // notify via socket to assignee
        const io = getIo(req);
        io && io.to(`user:${assigneeId}`).emit('workOrder.assigned', wo);
        // build push/message metadata: include assigner name and orgSeq; store a message key for frontend localization
        try {
            const actor = await User_1.default.findById(req.user?.id).lean();
            const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Admin';
            // create persistent notification using a message key; frontend will localize
            const notif = await Notification_1.default.create({ orgId, userId: assigneeId, actorId: req.user?.id, message: 'workorder.assigned', meta: { workOrderId: wo._id, orgSeq: wo.orgSeq, actorName } });
            // emit notification event
            io && io.to(`user:${assigneeId}`).emit('notifications.new', notif);
            // send push notifications to device tokens (FCM/APN) using a short localized string (fallback)
            try {
                const { sendPushToUser } = await Promise.resolve().then(() => __importStar(require('../utils/push')));
                const body = `You were assigned work order #${wo.orgSeq}`;
                sendPushToUser(assigneeId.toString(), { title: 'Work order assigned', body, data: { workOrderId: wo._id?.toString(), orgSeq: String(wo.orgSeq) } });
            }
            catch (e) {
                console.error('sendPush err', e);
            }
        }
        catch (e) {
            console.error('notification create/emit err', e);
        }
        // send email to assignee if exists
        const assignee = await User_1.default.findById(assigneeId).lean();
        if (assignee && assignee.email) {
            const subject = `You were assigned work order #${wo.orgSeq}`;
            const body = `<p>Hello ${assignee.firstName},</p><p>You have been assigned work order #${wo.orgSeq}.</p>`;
            Promise.resolve((0, mailer_1.sendNotificationEmail)(assignee.email, subject, body)).catch((e) => console.error('email err', e));
        }
        return res.json(wo);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function startWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    try {
        // only assignee can start (strict rule)
        const wo = await workOrdersService_1.default.findById(orgId.toString(), id);
        if (!wo)
            return res.status(404).json({ message: 'Not found' });
        // DEBUG: log requester and work order assignee to help debug permission issues
        try {
            console.log('[DEBUG] startWorkOrder req.user:', req.user, ' wo.assigneeId:', wo.assigneeId);
        }
        catch (e) { }
        // Allow start if user is the assignee, or an admin, or has the 'ejecutarOT' permission
        const user = req.user;
        const userId = user?.id;
        let allowed = false;
        if (wo.assigneeId && wo.assigneeId.toString() === userId)
            allowed = true;
        if (user?.isAdmin)
            allowed = true;
        if (!allowed && user?.roleId) {
            const role = await Role_1.default.findById(user.roleId).lean();
            const perms = role?.permissions || {};
            if (perms['ejecutarOT'])
                allowed = true;
        }
        if (!allowed) {
            return res.status(403).json({ message: 'Forbidden - only assignee or users with ejecutarOT permission can start the work order' });
        }
        const updated = await workOrdersService_1.default.transition(orgId.toString(), id, workOrderStates_1.WORK_ORDER_STATES.STARTED, userId, 'Work started');
        const io = getIo(req);
        io && io.to(`org:${orgId.toString()}`).emit('workOrder.started', updated);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function submitForReview(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    const { note } = req.body;
    try {
        const updated = await workOrdersService_1.default.transition(orgId.toString(), id, workOrderStates_1.WORK_ORDER_STATES.UNDER_REVIEW, req.user?.id, note || 'Sent to review');
        const io = getIo(req);
        io && io.to(`org:${orgId.toString()}`).emit('workOrder.submitted', updated);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function updateWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    try {
        console.log(orgId.toString(), id, req.body, req.user?.id);
        const updated = await workOrdersService_1.default.update(orgId.toString(), id, req.body, req.user?.id);
        if (!updated)
            return res.status(404).json({ message: 'Not found' });
        // emit socket event
        const io = getIo(req);
        io && io.to(`org:${orgId.toString()}`).emit('workOrder.updated', updated);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        if (err && err.status)
            return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function offlineSaveWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    try {
        // Accepts partial payload (typically { data: ... }) coming from IndexedDB sync
        const payload = req.body || {};
        const dataPayload = payload.data || payload;
        /* console.log('offlineSaveWorkOrder payload size:', dataPayload); */
        // Permission check: allow only assignee, admin, or users with 'ejecutarOT' permission
        const wo = await workOrdersService_1.default.findById(orgId.toString(), id);
        if (!wo)
            return res.status(404).json({ message: 'Not found' });
        const user = req.user;
        const userId = user?.id;
        let allowed = false;
        if (wo.assigneeId && wo.assigneeId.toString() === userId)
            allowed = true;
        if (user?.isAdmin)
            allowed = true;
        if (!allowed && user?.roleId) {
            const role = await Role_1.default.findById(user.roleId).lean();
            const perms = role?.permissions || {};
            if (perms['ejecutarOT'])
                allowed = true;
        }
        if (!allowed)
            return res.status(403).json({ message: 'Forbidden - only assignee or users with ejecutarOT permission can save offline data' });
        // Helper to save a base64 data URL to disk and create FileMeta entry
        const saveBase64ToFile = async (dataUrl, filenameHint = 'file') => {
            try {
                const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
                if (!matches)
                    return null;
                const mime = matches[1];
                const b64 = matches[2];
                const ext = mime.split('/')[1] || 'bin';
                const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${filenameHint}.${ext}`;
                const dir = path_1.default.join(process.cwd(), 'files', 'work-orders', orgId.toString(), id.toString());
                console.log('saveBase64ToFile dir:', dir);
                fs_1.default.mkdirSync(dir, { recursive: true });
                const filePath = path_1.default.join(dir, filename);
                fs_1.default.writeFileSync(filePath, Buffer.from(b64, 'base64'));
                // compute public URL
                const filesBase = path_1.default.join(process.cwd(), 'files');
                const rel = path_1.default.relative(filesBase, filePath).replace(/\\/g, '/');
                const publicUrl = `${req.protocol}://${req.get('host')}/files/${rel}`;
                const stat = fs_1.default.statSync(filePath);
                const meta = await FileMeta_1.default.create({ orgId: orgId.toString(), uploaderId: req.user?.id, filename, originalName: filenameHint, mimeType: mime, size: stat.size, storage: 'local', path: filePath, url: publicUrl, meta: { attachedTo: 'workOrder', workOrderId: id } });
                return { url: publicUrl, meta };
            }
            catch (e) {
                console.error('saveBase64ToFile err', e);
                return null;
            }
        };
        // Process photos: { uid: dataUrl }
        if (dataPayload && dataPayload.photos && typeof dataPayload.photos === 'object') {
            for (const k of Object.keys(dataPayload.photos)) {
                const v = dataPayload.photos[k];
                if (typeof v === 'string' && v.startsWith('data:')) {
                    const saved = await saveBase64ToFile(v, k);
                    if (saved)
                        dataPayload.photos[k] = saved.url;
                }
            }
        }
        // Process filesMap: { uid: { url: 'data:..' | existingUrl, name } }
        if (dataPayload && dataPayload.filesMap && typeof dataPayload.filesMap === 'object') {
            for (const k of Object.keys(dataPayload.filesMap)) {
                const item = dataPayload.filesMap[k];
                if (item && typeof item === 'object' && typeof item.url === 'string' && item.url.startsWith('data:')) {
                    const saved = await saveBase64ToFile(item.url, item.name || k);
                    if (saved)
                        dataPayload.filesMap[k] = { ...(item || {}), url: saved.url };
                }
            }
        }
        // Process dynamicLists: { fieldId: [ { type, value, name, ... } ] }
        if (dataPayload && dataPayload.dynamicLists && typeof dataPayload.dynamicLists === 'object') {
            for (const fieldId of Object.keys(dataPayload.dynamicLists)) {
                const arr = dataPayload.dynamicLists[fieldId] || [];
                for (let i = 0; i < arr.length; i++) {
                    const it = arr[i];
                    if (it && it.type === 'image' && typeof it.value === 'string' && it.value.startsWith('data:')) {
                        const saved = await saveBase64ToFile(it.value, `${fieldId}_${i}`);
                        if (saved)
                            arr[i] = { ...(it || {}), value: saved.url };
                    }
                }
            }
        }
        // After replacing base64 data with URLs, persist using update service
        const updated = await workOrdersService_1.default.update(orgId.toString(), id, { data: dataPayload }, req.user?.id);
        if (!updated)
            return res.status(404).json({ message: 'Not found' });
        const io = getIo(req);
        io && io.to(`org:${orgId.toString()}`).emit('workOrder.updated', updated);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        if (err && err.status)
            return res.status(err.status).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function approveWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    const { note } = req.body;
    try {
        const updated = await workOrdersService_1.default.transition(orgId.toString(), id, workOrderStates_1.WORK_ORDER_STATES.APPROVED, req.user?.id, note || 'Approved');
        const io = getIo(req);
        io && io.to(`org:${orgId.toString()}`).emit('workOrder.approved', updated);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function rejectWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    const { reason } = req.body;
    try {
        const updated = await workOrdersService_1.default.transition(orgId.toString(), id, workOrderStates_1.WORK_ORDER_STATES.ASSIGNED, req.user?.id, `Rejected: ${reason || ''}`);
        const io = getIo(req);
        io && io.to(`org:${orgId.toString()}`).emit('workOrder.rejected', updated);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
// Create a share token for a work order (authenticated)
async function shareWorkOrder(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const { id } = req.params;
    try {
        const wo = await workOrdersService_1.default.findById(orgId.toString(), id);
        if (!wo)
            return res.status(404).json({ message: 'Not found' });
        const ShareToken = await Promise.resolve().then(() => __importStar(require('../models/ShareToken')));
        const days = Number(req.body?.days || 7);
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        // try to create a unique token (rare collision handling)
        let doc = null;
        let attempts = 0;
        while (!doc && attempts < 6) {
            attempts += 1;
            const token = crypto_1.default.randomBytes(24).toString('hex');
            try {
                doc = await ShareToken.default.create({ token, orgId: orgId.toString(), workOrderId: id, createdBy: req.user?.id, expiresAt });
            }
            catch (err) {
                // duplicate key? try again
                if (err && (err.code === 11000 || err.message?.includes('duplicate key') || err.message?.includes('E11000'))) {
                    doc = null;
                    continue;
                }
                console.error('shareWorkOrder create err', err);
                return res.status(500).json({ message: 'Failed creating share token' });
            }
        }
        if (!doc)
            return res.status(500).json({ message: 'Could not generate a unique token' });
        const frontendBase = process.env.FRONTEND_URL || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
        const publicUrl = `${frontendBase.replace(/\/$/, '')}/public/work-orders/${doc.token}`;
        return res.json({ token: doc.token, expiresAt: doc.expiresAt, url: publicUrl });
    }
    catch (err) {
        console.error('shareWorkOrder err', err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
exports.default = {
    createWorkOrder,
    listWorkOrders,
    getWorkOrder,
    updateWorkOrder,
    offlineSaveWorkOrder,
    assignWorkOrder,
    startWorkOrder,
    submitForReview,
    approveWorkOrder,
    rejectWorkOrder,
    shareWorkOrder, uploadAttachment
};
