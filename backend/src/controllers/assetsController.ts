import { Request, Response } from 'express';
import Asset from '../models/Asset';
import DeviceModel from '../models/DeviceModel';
import Brand from '../models/Brand';
import AssetType from '../models/AssetType';
import Branch from '../models/Branch';

export async function create(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { modelId, brandId, typeId, docs } = req.body;

    // validate model, brand, and type if provided
    if (modelId) {
      const m = await DeviceModel.findOne({ _id: modelId, orgId }).lean();
      if (!m) return res.status(400).json({ message: 'Model not found' });
    }
    if (brandId) {
      const b = await Brand.findOne({ _id: brandId, orgId }).lean();
      if (!b) return res.status(400).json({ message: 'Brand not found' });
    }
    if (typeId) {
      const t = await AssetType.findOne({ _id: typeId, orgId }).lean();
      if (!t) return res.status(400).json({ message: 'Type not found' });
    }
    if (req.body.branchId) {
      const b = await Branch.findOne({ _id: req.body.branchId, orgId }).lean();
      if (!b) return res.status(400).json({ message: 'Branch not found' });
    }

    const data: any = { orgId, ...req.body };
    // ensure docs is array of ids
    if (docs && !Array.isArray(docs)) data.docs = [docs];

    const doc = await Asset.create(data);
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
    const docs = await Asset.find(q).populate('brandId').populate('modelId').populate('typeId').lean();
    return res.json({ items: docs });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    const doc = await Asset.findOne({ _id: id, orgId }).populate('brandId').populate('modelId').populate('typeId').lean();
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
    const doc = await Asset.findOneAndUpdate({ _id: id, orgId }, { $set: req.body }, { new: true }).lean();
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
    await Asset.findOneAndDelete({ _id: id, orgId });
    return res.status(204).send();
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { create, list, getOne, update, remove };
