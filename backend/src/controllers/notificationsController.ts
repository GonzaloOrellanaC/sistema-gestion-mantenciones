import { Request, Response } from 'express';
import Notification from '../models/Notification';
import NotificationModel from '../models/Notification';
// Notification creation deferred — keep controllers for listing/reading only

export async function markAsRead(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const userId = req.user?.id;
  const { id } = req.params;
  try {
    const doc = await NotificationModel.findOneAndUpdate({ _id: id, orgId, userId }, { $set: { read: true } }, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (e: any) {
    console.error('markAsRead err', e);
    return res.status(500).json({ message: e.message || 'server error' });
  }
}

export async function unreadCount(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const userId = req.user?.id;
  try {
    const count = await NotificationModel.countDocuments({ orgId, userId, read: { $ne: true } });
    return res.json({ count });
  } catch (e: any) {
    console.error('unreadCount err', e);
    return res.status(500).json({ message: e.message || 'server error' });
  }
}

export async function listNotifications(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const userId = req.user?.id;
  try {
    // support optional userId query for admins; default to authenticated user
    const queryUserId = String(req.query.userId || userId);
    if (req.query.userId && queryUserId !== userId && !(req as any).user?.isAdmin) {
      return res.status(403).json({ message: 'forbidden' });
    }

    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const skip = (page - 1) * limit;

    const filter: any = { orgId, userId: queryUserId };

    const [total, docs] = await Promise.all([
      NotificationModel.countDocuments(filter),
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const items = (docs || []).map((d: any) => ({
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
  } catch (err: any) {
    console.error('listNotifications err', err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}
// createNotification intentionally removed; notifications planned for later

export default {
  listNotifications,
  unreadCount,
  markAsRead,
};
