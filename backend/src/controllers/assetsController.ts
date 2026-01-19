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

export async function bulkCreate(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const payload = req.body;
    if (!Array.isArray(payload)) return res.status(400).json({ message: 'Payload must be an array' });

    const docsToInsert = payload.map((it: any) => ({ orgId, ...it }));
    const created = await Asset.insertMany(docsToInsert, { ordered: false });
    return res.status(201).json({ created });
  } catch (err: any) {
    console.error(err);
    if (err && err.insertedDocs) return res.status(201).json({ created: err.insertedDocs, error: err.message });
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const q: any = { orgId };
    if (req.query.branchId) q.branchId = String(req.query.branchId);
    if (req.query.name) q.name = { $regex: String(req.query.name), $options: 'i' };
    if (req.query.serial) q.serial = { $regex: String(req.query.serial), $options: 'i' };
    if (req.query.brandId) q.brandId = String(req.query.brandId);
    if (req.query.modelId) q.modelId = String(req.query.modelId);
    if (req.query.typeId) q.typeId = String(req.query.typeId);
    // support filtering by created date (YYYY-MM-DD)
    if (req.query.createdDate) {
      const val = String(req.query.createdDate);
      // expect YYYY-MM-DD; parse as local date to avoid timezone shifts
      const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const y = Number(isoMatch[1]);
        const m = Number(isoMatch[2]);
        const d = Number(isoMatch[3]);
        if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
          const start = new Date(y, m - 1, d, 0, 0, 0, 0);
          const end = new Date(y, m - 1, d, 23, 59, 59, 999);
          q.createdAt = { $gte: start, $lte: end };
        }
      } else {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          const start = new Date(parsed);
          start.setHours(0,0,0,0);
          const end = new Date(parsed);
          end.setHours(23,59,59,999);
          q.createdAt = { $gte: start, $lte: end };
        }
      }
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;
    const total = await Asset.countDocuments(q);
    const items = await Asset.find(q)
      .populate('brandId')
      .populate('modelId')
      .populate('typeId')
      .populate('branchId')
      .skip(skip)
      .limit(limit)
      .lean();
    const pages = Math.max(1, Math.ceil(total / limit));
    return res.json({ items, total, page, pages });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    // avoid casting non-object ids (like 'bulk-upload') to ObjectId
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const doc = await Asset.findOne({ _id: id, orgId })
      .populate('brandId')
      .populate('modelId')
      .populate('typeId')
      .populate('branchId')
      .lean();
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

export default { create, list, bulkCreate, getOne, update, remove };
