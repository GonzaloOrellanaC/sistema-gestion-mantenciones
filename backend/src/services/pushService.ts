import PushToken from '../models/PushToken';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/push';
import WorkOrder from '../models/WorkOrder';
import { Types } from 'mongoose';

// Firebase removed: delegate push sending to utils/push (APN only now).
async function sendToUser(userId: string, payload: { title: string; body: string; data?: any }) {
  try {
    // store notification in DB as well; enrich meta with orgSeq when possible
    const meta = Object.assign({}, payload.data || {});
    try {
      if (meta.workOrderId) {
        const wo = await WorkOrder.findById(meta.workOrderId).lean();
        if (wo && (wo as any).orgSeq) meta.orgSeq = (wo as any).orgSeq;
      }
    } catch (e) {
      // ignore
    }
    await Notification.create({ userId, message: payload.body, meta, read: false } as any);
    // attempt native push via utils/push (will only handle APN per configuration)
    await sendPushToUser(userId, payload);
  } catch (e) {
    console.error('sendToUser err', e);
  }
}

export default { sendToUser };
