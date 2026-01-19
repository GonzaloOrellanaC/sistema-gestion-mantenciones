import { Request, Response } from 'express';
import TypePurchase from '../models/TypePurchase';

export async function list(req: Request, res: Response) {
  try {
    const items = await TypePurchase.find({}).sort({ label: 1 }).lean();
    return res.json({ items });
  } catch (err: any) {
    console.error('typepurchases list error', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}

export default { list };
