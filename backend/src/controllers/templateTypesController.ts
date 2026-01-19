import { Request, Response } from 'express';
import TemplateType from '../models/TemplateType';

export async function create(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { name, meta } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const doc = await TemplateType.create({ orgId, name, meta });
    return res.status(201).json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const docs = await TemplateType.find({ orgId }).sort({ name: 1 }).lean();
    return res.json({ items: docs });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { create, list };
