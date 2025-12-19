import PushToken from '../models/PushToken';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/push';

// Firebase removed: delegate push sending to utils/push (APN only now).
async function sendToUser(userId: string, payload: { title: string; body: string; data?: any }) {
  try {
    // store notification in DB as well
    await Notification.create({ userId, message: payload.body, meta: payload.data || {}, read: false } as any);
    // attempt native push via utils/push (will only handle APN per configuration)
    await sendPushToUser(userId, payload);
  } catch (e) {
    console.error('sendToUser err', e);
  }
}

export default { sendToUser };
