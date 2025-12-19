import { Request, Response } from 'express';
import PushToken from '../models/PushToken';

export async function registerToken(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const userId = req.user?.id;
  const { token, platform } = req.body;
  if (!token) return res.status(400).json({ message: 'token required' });
  try {
    const doc = await PushToken.findOneAndUpdate({ orgId, userId, token }, { $set: { platform } }, { upsert: true, new: true });
    return res.json(doc);
  } catch (e: any) {
    console.error('registerToken err', e);
    return res.status(500).json({ message: e.message || 'server error' });
  }
}

export default { registerToken };
