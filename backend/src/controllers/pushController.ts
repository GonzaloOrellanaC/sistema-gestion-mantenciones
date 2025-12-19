import { Request, Response } from 'express';

export async function sendPush(req: Request, res: Response) {
  const { userId, title, body, data } = req.body;
  if (!userId || !body) return res.status(400).json({ message: 'userId and body required' });
  try {
    const { sendPushToUser } = await import('../utils/push');
    await sendPushToUser(userId, { title, body, data });
    return res.json({ ok: true });
  } catch (e: any) {
    console.error('sendPush controller err', e);
    return res.status(500).json({ message: e.message || 'server error' });
  }
}

export default { sendPush };
