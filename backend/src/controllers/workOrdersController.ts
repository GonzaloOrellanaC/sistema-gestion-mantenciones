import { Request, Response } from 'express';
import workOrdersService from '../services/workOrdersService';
import User from '../models/User';
import WorkOrder from '../models/WorkOrder';
import Role from '../models/Role';
import { sendNotificationEmail } from '../utils/mailer';
import FileMeta from '../models/FileMeta';
import path from 'path';

async function uploadAttachment(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // ensure work order exists and belongs to org
    const wo = await workOrdersService.findById(orgId, id);
    if (!wo) return res.status(404).json({ message: 'WorkOrder not found' });

    // store metadata
    const meta = await FileMeta.create({
      orgId,
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
    const updated = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $push: { attachments: meta._id } }, { new: true }).lean();

    // emit socket to assignee if exists else to uploader
    const io = getIo(req);
    const target = (wo.assigneeId && wo.assigneeId.toString()) || req.user?.id;
    io && io.to(`user:${target}`).emit('workOrder.attachmentAdded', { workOrder: updated, file: meta });

    return res.json({ workOrder: updated, file: meta });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

function getIo(req: Request) {
  return req.app.get('io');
}

async function createWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  try {
    const doc = await workOrdersService.createWorkOrder(orgId, req.body, req.user?.id);
    // emit socket event to creator
    const io = getIo(req);
    io && io.to(`user:${req.user?.id}`).emit('workOrder.created', doc);
    return res.status(201).json(doc);
  } catch (err: any) {
    console.error(err);
    if (err && err.status) return res.status(err.status).json({ message: err.message });
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function listWorkOrders(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  try {
    // Accept query params: page, limit, assigneeId, state, etc.
    console.log('Query params:', req.query);
    const q: {page?: number; limit?: number; filters?: any} = req.query || {};

    // If no explicit assigneeId filter is provided, only allow supervisors/admins to list all org orders
    const user: any = req.user;
    console.log({user})
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (!user.isAdmin) {
      if (!user.roleId) return res.status(403).json({ message: 'Forbidden - no role assigned' });
      const role = await Role.findById(user.roleId).lean();
      console.log({role})
      const perms: any = role?.permissions || {};
      if (!perms['manage_templates']) return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    }

    const docs = await workOrdersService.list(orgId, q);
    return res.json({ items: docs });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function getWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  try {
    const doc = await workOrdersService.findById(orgId, id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function assignWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { assigneeId, note } = req.body;
  try {
    const wo = await workOrdersService.assign(orgId, id, assigneeId, req.user?.id, note);

    // notify via socket to assignee
    const io = getIo(req);
    io && io.to(`user:${assigneeId}`).emit('workOrder.assigned', wo);

    // send email to assignee if exists
    const assignee = await User.findById(assigneeId).lean();
    if (assignee && assignee.email) {
      const subject = `Se te asignó OT #${wo.orgSeq}`;
      const body = `<p>Hola ${assignee.firstName},</p><p>Se te asignó la orden de trabajo #${wo.orgSeq}.</p>`;
      sendNotificationEmail(assignee.email, subject, body).catch((e) => console.error('email err', e));
    }

    return res.json(wo);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function startWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  try {
    // only assignee can start (strict rule)
    const wo = await workOrdersService.findById(orgId, id);
    if (!wo) return res.status(404).json({ message: 'Not found' });

    const userId = req.user?.id;
    if (!(wo.assigneeId && wo.assigneeId.toString() === userId)) {
      return res.status(403).json({ message: 'Forbidden - only assignee can start the work order' });
    }

    const updated = await workOrdersService.transition(orgId, id, 'Iniciado', userId, 'Inicio de trabajo');
    const io = getIo(req);
    io && io.to(`org:${orgId}`).emit('workOrder.started', updated);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function submitForReview(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { note } = req.body;
  try {
    const updated = await workOrdersService.transition(orgId, id, 'En revisión', req.user?.id, note || 'Enviado a revisión');
    const io = getIo(req);
    io && io.to(`org:${orgId}`).emit('workOrder.submitted', updated);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function approveWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { note } = req.body;
  try {
    const updated = await workOrdersService.transition(orgId, id, 'Terminado', req.user?.id, note || 'Aprobado');
    const io = getIo(req);
    io && io.to(`org:${orgId}`).emit('workOrder.approved', updated);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function rejectWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await workOrdersService.transition(orgId, id, 'Asignado', req.user?.id, `Rechazado: ${reason || ''}`);
    const io = getIo(req);
    io && io.to(`org:${orgId}`).emit('workOrder.rejected', updated);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

export default {
  createWorkOrder,
  listWorkOrders,
  getWorkOrder,
  assignWorkOrder,
  startWorkOrder,
  submitForReview,
  approveWorkOrder,
  rejectWorkOrder
  , uploadAttachment
};
