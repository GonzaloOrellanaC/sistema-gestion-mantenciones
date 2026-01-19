import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Lot from '../models/Lot';
import TypePurchase from '../models/TypePurchase';
import Part from '../models/Part';
import Supply from '../models/Supply';

export async function list(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const q: any = { orgId };
    if (req.query.branchId) q.branchId = String(req.query.branchId);
    if (req.query.supplier) q.supplier = { $regex: String(req.query.supplier), $options: 'i' };
    if (req.query.type) {
      const rawType = String(req.query.type);
      // allow passing either an ObjectId or the legacy type string ('repuestos'|'insumos') or label
      if (mongoose.Types.ObjectId.isValid(rawType)) {
        q.type = mongoose.Types.ObjectId(rawType);
      } else {
        // try to find matching TypePurchase by `type` field or by label (case-insensitive)
        try {
          const tp = await TypePurchase.findOne({ $or: [{ type: rawType }, { label: { $regex: `^${rawType}$`, $options: 'i' } }] }).lean();
          if (tp && tp._id) q.type = tp._id;
          else q.type = rawType; // fallback to raw string (legacy)
        } catch (e) {
          q.type = rawType;
        }
      }
    }
    if (req.query.code) q.code = { $regex: String(req.query.code), $options: 'i' };
    if (req.query.purchaseDate) {
      const val = String(req.query.purchaseDate);
      // expect YYYY-MM-DD; parse as local date to avoid timezone shifts
      const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const y = Number(isoMatch[1]);
        const m = Number(isoMatch[2]);
        const d = Number(isoMatch[3]);
        if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
          const start = new Date(y, m - 1, d, 0, 0, 0, 0);
          const end = new Date(y, m - 1, d, 23, 59, 59, 999);
          q.purchaseDate = { $gte: start, $lte: end };
        }
      } else {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          const start = new Date(parsed);
          start.setHours(0,0,0,0);
          const end = new Date(parsed);
          end.setHours(23,59,59,999);
          q.purchaseDate = { $gte: start, $lte: end };
        }
      }
    }

    // simple pagination support
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const total = await Lot.countDocuments(q);
    const items = await Lot.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'branchId', select: 'name' })
      .populate({ path: 'type', select: 'type label' })
      .lean();
    // populate item names for items.itemId (could reference Part or Supply)
    try {
      const allItemIds = new Set<string>();
      (items || []).forEach((it: any) => {
        if (Array.isArray(it.items)) it.items.forEach((ii: any) => { if (ii && ii.itemId) allItemIds.add(String(ii.itemId)); });
      });
      const ids = Array.from(allItemIds);
      if (ids.length) {
        const parts = await Part.find({ _id: { $in: ids } }).select('name').lean();
        const partMap: Record<string, any> = {};
        parts.forEach((p: any) => { partMap[String(p._id)] = p; });
        const remaining = ids.filter(id => !partMap[id]);
        const supplies = remaining.length ? await Supply.find({ _id: { $in: remaining } }).select('name').lean() : [];
        const supplyMap: Record<string, any> = {};
        supplies.forEach((s: any) => { supplyMap[String(s._id)] = s; });
        (items || []).forEach((it: any) => {
          if (Array.isArray(it.items)) it.items.forEach((ii: any) => {
            const key = String(ii.itemId);
            if (partMap[key]) ii.itemName = partMap[key].name;
            else if (supplyMap[key]) ii.itemName = supplyMap[key].name;
          });
        });
      }
    } catch (e) {
      // don't fail the whole request if name population fails
      console.warn('could not populate item names for lots list', e);
    }
    const pages = Math.max(1, Math.ceil(total / limit));
    return res.json({ items, total, page, pages });
  } catch (err: any) {
    console.error('lots list error', err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export default { list, getById, update, remove };

export async function getById(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const id = String(req.params.id || '');
    if (!id) return res.status(400).json({ message: 'Missing id' });
    const lot = await Lot.findOne({ _id: id, orgId }).populate({ path: 'branchId', select: 'name' }).populate({ path: 'type', select: 'type label' }).lean();
    if (!lot) return res.status(404).json({ message: 'Not found' });
      // populate item names for items.itemId (could reference Part or Supply)
      try {
        if (Array.isArray(lot.items) && lot.items.length) {
          for (const ii of lot.items) {
            try {
              const idStr = String(ii.itemId);
              const p = await Part.findById(idStr).select('name').lean();
              if (p && p.name) { ii.itemName = p.name; continue; }
              const s = await Supply.findById(idStr).select('name').lean();
              if (s && s.name) { ii.itemName = s.name; }
            } catch (e) {
              // ignore individual lookup errors
            }
          }
        }
      } catch (e) {
        console.warn('could not populate item names for lot', e);
      }
    return res.json(lot);
  } catch (err: any) {
    console.error('lots getById error', err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const id = String(req.params.id || '');
    if (!id) return res.status(400).json({ message: 'Missing id' });
    const payload: any = req.body || {};
    const update: any = {};
    if (payload.code !== undefined) update.code = payload.code;
    if (payload.supplier !== undefined) update.supplier = payload.supplier;
    if (payload.purchaseDate !== undefined) update.purchaseDate = payload.purchaseDate ? new Date(payload.purchaseDate) : undefined;
    if (payload.type !== undefined) {
      const t = String(payload.type);
      if (['insumos', 'repuestos'].includes(t)) update.type = t;
    }
    if (payload.price !== undefined) update.price = payload.price;
    // support items array: [{ itemId, quantity, unitPrice? }]
    let items: any[] | undefined = undefined;
    if (Array.isArray(payload.items)) {
      items = payload.items.map((it: any) => ({
        itemId: it.itemId || it._id,
        quantity: typeof it.quantity === 'string' ? Number(it.quantity || 0) : (it.quantity || 0),
        unitPrice: it.unitPrice !== undefined ? (typeof it.unitPrice === 'string' ? Number(it.unitPrice) : it.unitPrice) : undefined
      }));
      update.items = items;
    }
    if (payload.notes !== undefined) update.meta = { ...(payload.meta || {}), notes: payload.notes };

    // If items provided, and there is potential need to compute unitPrice for a single-item lot,
    // compute it before persisting.
    if (items && items.length === 1) {
      const single = items[0];
      if ((single.unitPrice === undefined || single.unitPrice === null) && update.price !== undefined && single.quantity > 0) {
        single.unitPrice = Number(update.price) / Number(single.quantity);
        update.items = [single];
      }
    }

    // If items provided and price not explicitly set, compute total price from unitPrice * quantity
    if ((update.price === undefined || update.price === null) && items && items.length) {
      let canCompute = true;
      let total = 0;
      for (const it of items) {
        if (it.unitPrice === undefined || it.unitPrice === null) { canCompute = false; break; }
        total += Number(it.quantity || 0) * Number(it.unitPrice);
      }
      if (canCompute) update.price = total;
    }

    // Use a transaction to update lot and corresponding part/supply prices atomically when possible
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updated = await Lot.findOneAndUpdate({ _id: id, orgId }, { $set: update }, { new: true, session }).lean();
      if (!updated) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Not found' });
      }

      // propagate unit prices to Part or Supply documents when unitPrice is available
      if (Array.isArray(update.items) && update.items.length) {
        for (const it of update.items) {
          try {
            const itemId = String(it.itemId);
            const qty = Number(it.quantity || 0);
            const unit = it.unitPrice !== undefined && it.unitPrice !== null ? Number(it.unitPrice) : undefined;
            if (unit === undefined) continue; // nothing to propagate

            if ((updated.type || payload.type) === 'repuestos') {
              // update Part: set price, lotId and push stock entry
              await Part.findOneAndUpdate(
                { _id: itemId, orgId },
                { $set: { price: unit, lotId: updated._id }, $push: { stock: { branchId: updated.branchId, lotId: updated._id, quantity: qty, unitPrice: unit } } },
                { session }
              );
            } else {
              // supply: set price, lot info and push stock entry
              const lotRef = updated.code || String(updated._id);
              await Supply.findOneAndUpdate(
                { _id: itemId, orgId },
                { $set: { price: unit, lotId: updated._id, lot: lotRef, lotDate: updated.purchaseDate }, $push: { stock: { branchId: updated.branchId, lotId: updated._id, quantity: qty, unitPrice: unit } } },
                { session }
              );
            }
          } catch (e) {
            console.warn('error updating item price from lot', e);
          }
        }
      }

      await session.commitTransaction();
      session.endSession();
      return res.json(updated);
    } catch (err2: any) {
      await session.abortTransaction();
      session.endSession();
      throw err2;
    }
  } catch (err: any) {
    console.error('lots update error', err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const orgId = (req as any).user.orgId;
    const id = String(req.params.id || '');
    if (!id) return res.status(400).json({ message: 'Missing id' });
    const r = await Lot.deleteOne({ _id: id, orgId });
    if (r.deletedCount === 0) return res.status(404).json({ message: 'Not found' });
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('lots remove error', err);
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
}
