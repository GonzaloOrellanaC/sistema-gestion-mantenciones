import { Request, Response } from 'express';
import Part from '../models/Part';
import Branch from '../models/Branch';
import Asset from '../models/Asset';
import WorkOrder from '../models/WorkOrder';

export async function create(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { branchId, assetId, workOrderId } = req.body;

    if (branchId) {
      const b = await Branch.findOne({ _id: branchId, orgId }).lean();
      if (!b) return res.status(400).json({ message: 'Branch not found' });
    }
    if (assetId) {
      const a = await Asset.findOne({ _id: assetId, orgId }).lean();
      if (!a) return res.status(400).json({ message: 'Asset not found' });
    }
    if (workOrderId) {
      const w = await WorkOrder.findOne({ _id: workOrderId, orgId }).lean();
      if (!w) return res.status(400).json({ message: 'Work order not found' });
    }

    const data: any = { orgId, ...req.body };
    const doc = await Part.create(data);
    return res.status(201).json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const q: any = { orgId };
    if (req.query.branchId) q.branchId = String(req.query.branchId);
    if (req.query.assetId) q.assetId = String(req.query.assetId);
    if (req.query.available === 'true') q.dateInUse = { $exists: false };

    const items = await Part.find(q).populate('branchId').populate('assetId').populate('workOrderId').lean();
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
    const doc = await Part.findOne({ _id: id, orgId }).populate('branchId').populate('assetId').populate('workOrderId').lean();
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
    const doc = await Part.findOneAndUpdate({ _id: id, orgId }, { $set: req.body }, { new: true }).lean();
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
    await Part.findOneAndDelete({ _id: id, orgId });
    return res.status(204).send();
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { create, list, getOne, update, remove };
