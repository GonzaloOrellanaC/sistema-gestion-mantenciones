import { Request, Response } from 'express';
import Part from '../models/Part';
import FileMeta from '../models/FileMeta';
import fs from 'fs';
import Lot from '../models/Lot';
import Branch from '../models/Branch';
import Asset from '../models/Asset';
import WorkOrder from '../models/WorkOrder';
import PartInventory from '../models/PartInventory';
import mongoose from 'mongoose';

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
    // normalize types from form submissions
    if (typeof data.price === 'string') data.price = Number(data.price) || 0;
    // If a lot code/id is provided as string, leave casting to mongoose (will cast to ObjectId if appropriate)
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
    if (req.query.branchId) q.branchIds = new mongoose.Types.ObjectId(String(req.query.branchId));
    // support assetId or assetIds (comma separated)
    if (req.query.assetId) q.assetIds = new mongoose.Types.ObjectId(String(req.query.assetId));
    if (req.query.assetIds) {
      const raw = String(req.query.assetIds || '');
      const ids = raw.split(',').map(s => s.trim()).filter(Boolean).map(s => new mongoose.Types.ObjectId(s));
      if (ids.length) q.assetIds = { $in: ids };
    }

    const lowOnly = (req.query.lowStock === '1' || String(req.query.lowStock) === 'true');

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // If lowStock filter requested, precompute which part ids are low and restrict query
    if (lowOnly) {
      const allParts = await Part.find(q).select('_id minStock').lean();
      const ids = allParts.map((p: any) => p._id);
      const aggMatchOrgId = new mongoose.Types.ObjectId(String(orgId));
      const aggItemIds = ids.map((x: any) => new mongoose.Types.ObjectId(String(x)));
      const invAgg = await PartInventory.aggregate([
        { $match: { orgId: aggMatchOrgId, itemId: { $in: aggItemIds } } },
        { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' } } }
      ]);
      const remainingMap: Record<string, number> = {};
      invAgg.forEach((a: any) => { remainingMap[String(a._id)] = a.remaining || 0; });
      const lowIds = allParts.filter((p: any) => {
        const rem = remainingMap[String(p._id)] || 0;
        const min = Number(p.minStock || 0);
        return rem <= min;
      }).map((p: any) => p._id);
      if (lowIds.length === 0) return res.json({ items: [], total: 0, page: 1, pages: 1 });
      q._id = { $in: lowIds };
    }

    const total = await Part.countDocuments(q);
    const items = await Part.find(q).populate('docs').populate({ path: 'branchIds', select: 'name' }).populate({ path: 'assetIds', select: 'name' }).skip(skip).limit(limit).lean();

    // attach inventory totals (remaining and initial) for returned parts
    const ids = items.map((p: any) => p._id);
    const aggMatchOrgId2 = new mongoose.Types.ObjectId(String(orgId));
    const aggItemIds2 = ids.map((x: any) => new mongoose.Types.ObjectId(String(x)));
    const invAgg = ids.length > 0 ? await PartInventory.aggregate([
      { $match: { orgId: aggMatchOrgId2, itemId: { $in: aggItemIds2 } } },
      { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' }, initial: { $sum: '$initialQuantity' } } }
    ]) : [];
    const invMap: Record<string, any> = {};
    invAgg.forEach((a: any) => { invMap[String(a._id)] = a; });

    // fetch inventories per item (detailed) and group by itemId
    const invDetails = ids.length ? await PartInventory.find({ orgId: aggMatchOrgId2, itemId: { $in: aggItemIds2 } }).populate({ path: 'lotId', select: 'code purchaseDate price supplier' }).lean() : [];
    const invByItem: Record<string, any[]> = {};
    invDetails.forEach((it: any) => {
      const key = String(it.itemId);
      if (!invByItem[key]) invByItem[key] = [];
      invByItem[key].push(it);
    });

    const mapped = items.map((p: any) => {
      const idStr = String(p._id);
      const totalRemaining = invMap[idStr] ? invMap[idStr].remaining : 0;
      const min = Number(p.minStock || 0);
      let stockStatus = 'unknown';
      if (totalRemaining <= 0) stockStatus = 'out';
      else if (min > 0 && totalRemaining <= min) stockStatus = 'low';
      else stockStatus = 'ok';
      return {
        ...p,
        quantity: totalRemaining,
        initialQuantity: invMap[idStr] ? invMap[idStr].initial : 0,
        inventories: invByItem[idStr] || [],
        stockStatus
      };
    });
    const pages = Math.max(1, Math.ceil(total / limit));
    return res.json({ items: mapped, total, page, pages });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function availability(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { partIds } = req.body || {};
    if (!Array.isArray(partIds) || partIds.length === 0) {
      return res.json({ items: [] });
    }
    // find parts in one query
    // sum remainingQuantity from PartInventory for requested parts
    const aggOrgId = new mongoose.Types.ObjectId(String(orgId));
    const aggIds = partIds.map((p: any) => new mongoose.Types.ObjectId(String(p)));
    const agg = await PartInventory.aggregate([
      { $match: { orgId: aggOrgId, itemId: { $in: aggIds } } },
      { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' } } }
    ]);
    const remMap: Record<string, number> = {};
    agg.forEach((a: any) => { remMap[String(a._id)] = a.remaining || 0; });
    const parts = await Part.find({ orgId, _id: { $in: partIds } }).lean();
    const byId: Record<string, any> = {};
    parts.forEach((p: any) => { byId[String(p._id)] = p; });
    const items = partIds.map((id: any) => ({ partId: id, available: remMap[String(id)] || 0, part: byId[String(id)] || null }));
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
    const doc = await Part.findOne({ _id: id, orgId }).populate('docs').lean();
    if (!doc) return res.status(404).json({ message: 'Not found' });
    // attach inventory entries for this part
    const inv = await PartInventory.find({ orgId: mongoose.Types.ObjectId(String(orgId)), itemId: mongoose.Types.ObjectId(String(id)) }).populate({ path: 'lotId', select: 'code purchaseDate price supplier' }).lean();
    const totalRemaining = inv.reduce((s: number, x: any) => s + (Number(x.remainingQuantity || 0)), 0);
    return res.json({ ...doc, inventories: inv, quantity: totalRemaining });
  } catch (err: any) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const { id } = req.params;
    const data: any = { ...req.body };
    if (typeof data.price === 'string') data.price = Number(data.price) || 0;

    // handle docsToRemove: delete file from storage (if local) and remove FileMeta records
    const docsToRemove: string[] = Array.isArray(data.docsToRemove) ? data.docsToRemove.map(String) : [];
    if (docsToRemove.length > 0) {
      try {
        const metas = await FileMeta.find({ _id: { $in: docsToRemove }, orgId }).lean();
        for (const m of metas) {
          try {
            if (m.storage === 'local' && m.path) {
              fs.unlinkSync(String(m.path));
            }
          } catch (e) {
            console.warn('failed removing file from disk', m.path, e);
          }
        }
        await FileMeta.deleteMany({ _id: { $in: docsToRemove }, orgId });
        // ensure part doc references are removed
        await Part.findOneAndUpdate({ _id: id, orgId }, { $pull: { docs: { $in: docsToRemove } } });
      } catch (e) {
        console.warn('error processing docsToRemove', e);
      }
      // remove flag from incoming data so we don't try to set it
      delete data.docsToRemove;
    }

    const doc = await Part.findOneAndUpdate({ _id: id, orgId }, { $set: data }, { new: true }).lean();
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

export default { create, list, availability, getOne, update, remove };
