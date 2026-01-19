import { Request, Response } from 'express';
import workOrdersService from '../services/workOrdersService';
import User from '../models/User';
import WorkOrder from '../models/WorkOrder';
import Role from '../models/Role';
import { sendNotificationEmail } from '../utils/mailer';
import FileMeta from '../models/FileMeta';
import Notification from '../models/Notification';
import path from 'path';

async function uploadAttachment(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;

  if (!orgId) {
    res.status(400).json({ message: 'orgId missing' });
  } else {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      // ensure work order exists and belongs to org
      const wo = await workOrdersService.findById(orgId.toString(), id);
      if (!wo) return res.status(404).json({ message: 'WorkOrder not found' });

      // store metadata
      const meta = await FileMeta.create({
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
        const filesBase = path.join(process.cwd(), 'files');
        const rel = path.relative(filesBase, req.file.path).replace(/\\/g, '/');
        const publicUrl = `${req.protocol}://${req.get('host')}/files/${rel}`;
        // update meta with public url
        meta.url = publicUrl;
        await meta.save();
      } catch (e) {
        // ignore
      }

      // attach to work order
      await WorkOrder.findOneAndUpdate({ _id: id, orgId: orgId.toString() }, { $push: { attachments: meta._id } }, { new: true });

      // fetch populated work order
      const populated = await workOrdersService.findById(orgId.toString(), id);

      // emit socket to assignee if exists else to uploader
      const io = getIo(req);
      const target = (wo.assigneeId && wo.assigneeId.toString()) || req.user?.id;
      io && io.to(`user:${target}`).emit('workOrder.attachmentAdded', { workOrder: populated, file: meta });

      return res.json({ workOrder: populated, file: meta });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: err.message || 'server error' });
    }
  }
}

function getIo(req: Request) {
  return req.app.get('io');
}

async function createWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  try {
    const doc = await workOrdersService.createWorkOrder(orgId.toString(), req.body, req.user?.id);
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
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
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
      if (!perms['ejecutarOT']) return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    }

    const result = await workOrdersService.list(orgId.toString(), q);
    return res.json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function getWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  const { id } = req.params;
  try {
    const doc = await workOrdersService.findById(orgId?.toString(), id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function assignWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  const { id } = req.params;
  const { assigneeId, note } = req.body;
  try {
    const wo = await workOrdersService.assign(orgId?.toString(), id, assigneeId, req.user?.id, note);
    if (!wo) return res.status(404).json({ message: 'Not found' });
    // notify via socket to assignee
    const io = getIo(req);
    io && io.to(`user:${assigneeId}`).emit('workOrder.assigned', wo);

    // build push message: include assigner name and orgSeq
    try {
      const actor = await User.findById(req.user?.id).lean();
      const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Administrador';
      const message = `El administrador ${actorName} le ha asignado la OT #${wo.orgSeq}`;

      // create persistent notification for assignee
      const notif = await Notification.create({ orgId, userId: assigneeId, actorId: req.user?.id, message, meta: { workOrderId: wo._id, orgSeq: wo.orgSeq } });

      // emit notification event
      io && io.to(`user:${assigneeId}`).emit('notifications.new', notif);

      // send push notifications to device tokens (FCM/APN)
      try {
        const { sendPushToUser } = await import('../utils/push');
        sendPushToUser(assigneeId.toString(), { title: 'Se te asignó una OT', body: message, data: { workOrderId: wo._id?.toString(), orgSeq: String(wo.orgSeq) } });
      } catch (e) {
        console.error('sendPush err', e);
      }
    } catch (e) {
      console.error('notification create/emit err', e);
    }

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
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  const { id } = req.params;
  try {
    // only assignee can start (strict rule)
    const wo = await workOrdersService.findById(orgId.toString(), id);
    if (!wo) return res.status(404).json({ message: 'Not found' });

    // DEBUG: log requester and work order assignee to help debug permission issues
    try { console.log('[DEBUG] startWorkOrder req.user:', req.user, ' wo.assigneeId:', wo.assigneeId); } catch (e) { }

    // Allow start if user is the assignee, or an admin, or has the 'ejecutarOT' permission
    const user: any = req.user;
    const userId = user?.id;
    let allowed = false;
    if (wo.assigneeId && wo.assigneeId.toString() === userId) allowed = true;
    if (user?.isAdmin) allowed = true;
    if (!allowed && user?.roleId) {
      const role = await Role.findById(user.roleId).lean();
      const perms: any = role?.permissions || {};
      if (perms['ejecutarOT']) allowed = true;
    }
    if (!allowed) {
      return res.status(403).json({ message: 'Forbidden - only assignee or users with ejecutarOT permission can start the work order' });
    }

    const updated = await workOrdersService.transition(orgId.toString(), id, 'Iniciado', userId, 'Inicio de trabajo');
    const io = getIo(req);
    io && io.to(`org:${orgId.toString()}`).emit('workOrder.started', updated);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function submitForReview(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  const { id } = req.params;
  const { note } = req.body;
  try {
    const updated = await workOrdersService.transition(orgId.toString(), id, 'En revisión', req.user?.id, note || 'Enviado a revisión');
    const io = getIo(req);
    io && io.to(`org:${orgId.toString()}`).emit('workOrder.submitted', updated);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function updateWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  const { id } = req.params;
  try {
    const updated = await workOrdersService.update(orgId.toString(), id, req.body, req.user?.id);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    // emit socket event
    const io = getIo(req);
    io && io.to(`org:${orgId.toString()}`).emit('workOrder.updated', updated);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    if (err && err.status) return res.status(err.status).json({ message: err.message });
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function approveWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  const { id } = req.params;
  const { note } = req.body;
  try {
    const updated = await workOrdersService.transition(orgId.toString(), id, 'Terminado', req.user?.id, note || 'Aprobado');
    const io = getIo(req);
    io && io.to(`org:${orgId.toString()}`).emit('workOrder.approved', updated);
    return res.json(updated);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function rejectWorkOrder(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await workOrdersService.transition(orgId.toString(), id, 'Asignado', req.user?.id, `Rechazado: ${reason || ''}`);
    const io = getIo(req);
    io && io.to(`org:${orgId.toString()}`).emit('workOrder.rejected', updated);
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
  updateWorkOrder,
  assignWorkOrder,
  startWorkOrder,
  submitForReview,
  approveWorkOrder,
  rejectWorkOrder
  , uploadAttachment
};
