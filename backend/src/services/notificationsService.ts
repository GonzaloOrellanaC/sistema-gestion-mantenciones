import Notification from '../models/Notification';
import { Types } from 'mongoose';
import WorkOrder from '../models/WorkOrder';

async function createNotification(orgId: string, userId: string, actorId: string | undefined, messageKey: string, meta?: any) {
  if (!userId) return null;
  try {
    // enrich meta with orgSeq when workOrderId is provided
    const enhancedMeta = Object.assign({}, meta || {});
    try {
      if (enhancedMeta.workOrderId) {
        const wo = await WorkOrder.findOne({ _id: enhancedMeta.workOrderId, orgId: new Types.ObjectId(orgId) }).lean();
        if (wo && (wo as any).orgSeq) enhancedMeta.orgSeq = (wo as any).orgSeq;
      }
    } catch (e) {
      // ignore enrichment errors
    }

    const doc = new Notification({
      orgId: new Types.ObjectId(orgId),
      userId: new Types.ObjectId(userId),
      actorId: actorId ? new Types.ObjectId(actorId) : undefined,
      message: messageKey,
      meta: enhancedMeta,
      read: false,
      createdAt: new Date()
    });
    return await doc.save();
  } catch (e) {
    console.error('createNotification error', e);
    return null;
  }
}

export default { createNotification };
