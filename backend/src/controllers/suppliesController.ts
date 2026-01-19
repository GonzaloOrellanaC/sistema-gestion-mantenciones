import { Request, Response } from 'express';
import Supply from '../models/Supply';
import MaintenanceEvent from '../models/MaintenanceEvent';
import SupplyInventory from '../models/SupplyInventory';
import Branch from '../models/Branch';
import Asset from '../models/Asset';
import mongoose from 'mongoose';

export async function list(req: Request, res: Response) {
  try {
    const orgId = (req as any).user?.orgId;
    const q: any = {};
    if (orgId) q.orgId = orgId;
    // support branchId / assetId filters similar to parts
    if (req.query.branchId) q.branchIds = new mongoose.Types.ObjectId(String(req.query.branchId));
    if (req.query.assetId) q.assetIds = new mongoose.Types.ObjectId(String(req.query.assetId));
    if (req.query.assetIds) {
      const raw = String(req.query.assetIds || '');
      const ids = raw.split(',').map(s => s.trim()).filter(Boolean).map(s => new mongoose.Types.ObjectId(s));
      if (ids.length) q.assetIds = { $in: ids };
    }

    const lowOnly = (req.query.lowStock === '1' || String(req.query.lowStock) === 'true');
    // support filtering by assetIds: return supplies used in maintenance events for those assets
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    if (req.query.assetIds) {
      const raw = String(req.query.assetIds || '');
      const ids = raw.split(',').map(s => s.trim()).filter(Boolean).map((s) => new mongoose.Types.ObjectId(s));
      if (ids.length) {
        // aggregate supplies used in maintenance events for these assets
        const agg = await MaintenanceEvent.aggregate([
          { $match: { assetId: { $in: ids }, orgId: q.orgId } },
          { $unwind: '$suppliesUsed' },
          { $group: { _id: '$suppliesUsed.supplyId', qty: { $sum: '$suppliesUsed.qty' } } },
          { $sort: { qty: -1 } },
          { $skip: skip },
          { $limit: limit }
        ]).allowDiskUse(true);
        const supplyIds = agg.map((a: any) => a._id).filter(Boolean);
        const items = supplyIds.length ? await Supply.find({ _id: { $in: supplyIds } }).lean() : [];
        const total = agg.length; // best-effort total within this aggregation window
        res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
      }
    } else {
      // If lowOnly requested, precompute which supplies are low by aggregating inventories
      if (lowOnly) {
        const allSupplies = await Supply.find(q).select('_id minStock').lean();
        const idsAll = allSupplies.map((p: any) => new mongoose.Types.ObjectId(p._id));
        const invAgg = await SupplyInventory.aggregate([
          { $match: { orgId: new mongoose.Types.ObjectId(String(orgId)), itemId: { $in: idsAll } } },
          { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' } } }
        ]).allowDiskUse(true);
        const remainingMap: Record<string, number> = {};
        invAgg.forEach((a: any) => { remainingMap[String(a._id)] = a.remaining || 0; });
        const lowIds = allSupplies.filter((p: any) => {
          const rem = remainingMap[String(p._id)] || 0;
          const min = Number(p.minStock || 0);
          // needs attention when remaining < minStock
          return rem < min;
        }).map((p: any) => p._id);
        if (lowIds.length === 0) return res.json({ items: [], total: 0, page: 1, pages: 1 });
        q._id = { $in: lowIds };
      }

      const total = await Supply.countDocuments(q);
      const items = await Supply.find(q).populate({ path: 'branchIds', select: 'name' }).populate({ path: 'assetIds', select: 'name' }).skip(skip).limit(limit).lean();

      // attach inventory totals (remaining and initial) and detailed inventories for returned supplies
      const ids = items.map((p: any) => new mongoose.Types.ObjectId(p._id));
      const invAgg = ids.length ? await SupplyInventory.aggregate([
        { $match: { orgId: new mongoose.Types.ObjectId(String(orgId)), itemId: { $in: ids } } },
        { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' }, initial: { $sum: '$initialQuantity' } } }
      ]).allowDiskUse(true) : [];
      const invMap: Record<string, any> = {};
      invAgg.forEach((a: any) => { invMap[String(a._id)] = a; });

      // fetch detailed inventory documents and populate lot info
      const invDocs = ids.length ? await SupplyInventory.find({ orgId: orgId ? new mongoose.Types.ObjectId(String(orgId)) : undefined, itemId: { $in: ids } }).populate({ path: 'lotId', select: 'code branchId purchaseDate price supplier' }).lean() : [];
      const invByItem: Record<string, any[]> = {};
      invDocs.forEach((d: any) => {
        const key = String(d.itemId);
        if (!invByItem[key]) invByItem[key] = [];
        invByItem[key].push(d);
      });

      const mapped = items.map((p: any) => {
        const key = String(p._id);
        const remaining = invMap[key] ? invMap[key].remaining : 0;
        const initial = invMap[key] ? invMap[key].initial : 0;
        const inventories = invByItem[key] || [];
        // compute stockStatus: out if remaining <= 0, low if remaining < minStock, else ok
        const min = Number(p.minStock || 0);
        let stockStatus: 'ok' | 'low' | 'out' = 'ok';
        if (remaining <= 0) stockStatus = 'out';
        else if (min > 0 && remaining < min) stockStatus = 'low';
        return { ...p, quantity: remaining, initialQuantity: initial, inventories, stockStatus };
      });

      const pages = Math.max(1, Math.ceil(total / limit));
      res.json({ items: mapped, total, page, pages });
    }
  } catch (err: any) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const orgId = (req as any).user?.orgId || req.body.orgId;
    if (!orgId) {
      res.status(400).json({ message: 'orgId required' });
    } else {
      const data: any = { orgId, ...req.body };
      // If multipart/form-data, fields may be strings; convert numeric/date fields
      if (typeof data.quantity === 'string') data.quantity = Number(data.quantity) || 0;
      if (typeof data.price === 'string') data.price = Number(data.price) || 0;
      if (data.lotDate) data.lotDate = new Date(data.lotDate);
      const doc = await Supply.create(data);
      res.status(201).json(doc);
    }
  } catch (err: any) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log('getById id=', id);
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
    } else {
      const orgId = (req as any).user?.orgId;
      const q: any = { _id: id };
      if (orgId) q.orgId = orgId;
      const item = await Supply.findOne(q).populate('docs').populate({ path: 'branchIds', select: 'name' }).populate({ path: 'assetIds', select: 'name' }).lean();
      if (!item) return res.status(404).json({ message: 'Supply not found' });
      // attach inventory entries for this supply
      const inv = await SupplyInventory.find({ orgId: orgId ? new mongoose.Types.ObjectId(String(orgId)) : undefined, itemId: new mongoose.Types.ObjectId(String(id)) }).populate({ path: 'lotId', select: 'code purchaseDate price supplier' }).lean();
      const totalRemaining = inv.reduce((s: number, x: any) => s + (Number(x.remainingQuantity || 0)), 0);
      return res.json({ ...item, inventories: inv, quantity: totalRemaining });
    }
  } catch (err: any) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { list, create, getById };
