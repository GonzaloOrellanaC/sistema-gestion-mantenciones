import { Request, Response } from 'express';
import Notification from '../models/Notification';
import NotificationModel from '../models/Notification';

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
    const docs = await Notification.find({ orgId, userId }).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ items: docs });
  } catch (err: any) {
    console.error('listNotifications err', err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

export default {
  listNotifications,
  unreadCount,
  markAsRead,
};
