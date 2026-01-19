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
const User_1 = __importDefault(require("../models/User"));
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
const Role_1 = __importDefault(require("../models/Role"));
const mailer_1 = require("../utils/mailer");
const FileMeta_1 = __importDefault(require("../models/FileMeta"));
const Notification_1 = __importDefault(require("../models/Notification"));
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
            // attach to work order
            const updated = await WorkOrder_1.default.findOneAndUpdate({ _id: id, orgId: orgId.toString() }, { $push: { attachments: meta._id } }, { new: true }).lean();
            // emit socket to assignee if exists else to uploader
            const io = getIo(req);
            const target = (wo.assigneeId && wo.assigneeId.toString()) || req.user?.id;
            io && io.to(`user:${target}`).emit('workOrder.attachmentAdded', { workOrder: updated, file: meta });
            return res.json({ workOrder: updated, file: meta });
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
        console.log('Query params:', req.query);
        const q = req.query || {};
        // If no explicit assigneeId filter is provided, only allow supervisors/admins to list all org orders
        const user = req.user;
        console.log({ user });
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
        const docs = await workOrdersService_1.default.list(orgId.toString(), q);
        return res.json({ items: docs });
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
        // build push message: include assigner name and orgSeq
        try {
            const actor = await User_1.default.findById(req.user?.id).lean();
            const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Administrador';
            const message = `El administrador ${actorName} le ha asignado la OT #${wo.orgSeq}`;
            // create persistent notification for assignee
            const notif = await Notification_1.default.create({ orgId, userId: assigneeId, actorId: req.user?.id, message, meta: { workOrderId: wo._id, orgSeq: wo.orgSeq } });
            // emit notification event
            io && io.to(`user:${assigneeId}`).emit('notifications.new', notif);
            // send push notifications to device tokens (FCM/APN)
            try {
                const { sendPushToUser } = await Promise.resolve().then(() => __importStar(require('../utils/push')));
                sendPushToUser(assigneeId.toString(), { title: 'Se te asignó una OT', body: message, data: { workOrderId: wo._id?.toString(), orgSeq: String(wo.orgSeq) } });
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
            const subject = `Se te asignó OT #${wo.orgSeq}`;
            const body = `<p>Hola ${assignee.firstName},</p><p>Se te asignó la orden de trabajo #${wo.orgSeq}.</p>`;
            (0, mailer_1.sendNotificationEmail)(assignee.email, subject, body).catch((e) => console.error('email err', e));
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
        const userId = req.user?.id;
        if (!(wo.assigneeId && wo.assigneeId.toString() === userId)) {
            return res.status(403).json({ message: 'Forbidden - only assignee can start the work order' });
        }
        const updated = await workOrdersService_1.default.transition(orgId.toString(), id, 'Iniciado', userId, 'Inicio de trabajo');
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
        const updated = await workOrdersService_1.default.transition(orgId.toString(), id, 'En revisión', req.user?.id, note || 'Enviado a revisión');
        const io = getIo(req);
        io && io.to(`org:${orgId.toString()}`).emit('workOrder.submitted', updated);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
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
        const updated = await workOrdersService_1.default.transition(orgId.toString(), id, 'Terminado', req.user?.id, note || 'Aprobado');
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
        const updated = await workOrdersService_1.default.transition(orgId.toString(), id, 'Asignado', req.user?.id, `Rechazado: ${reason || ''}`);
        const io = getIo(req);
        io && io.to(`org:${orgId.toString()}`).emit('workOrder.rejected', updated);
        return res.json(updated);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
exports.default = {
    createWorkOrder,
    listWorkOrders,
    getWorkOrder,
    assignWorkOrder,
    startWorkOrder,
    submitForReview,
    approveWorkOrder,
    rejectWorkOrder,
    uploadAttachment
};
