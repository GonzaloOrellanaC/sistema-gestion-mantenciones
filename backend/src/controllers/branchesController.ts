import { Request, Response } from 'express';
import Branch from '../models/Branch';

export async function create(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { name, address, branchType, meta } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const b = await Branch.create({ orgId, name, address, branchType, meta });
    return res.status(201).json(b);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const items = await Branch.find({ orgId }).sort({ name: 1 }).lean();
    return res.json({ items });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    const doc = await Branch.findOne({ _id: id, orgId }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    const doc = await Branch.findOneAndUpdate({ _id: id, orgId }, { $set: req.body }, { new: true }).lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    await Branch.findOneAndDelete({ _id: id, orgId });
    return res.status(204).send();
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { create, list, getOne, update, remove };
