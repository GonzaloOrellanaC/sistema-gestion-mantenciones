import mongoose from 'mongoose';
import StockModel from '../models/Stock';
import StockMovementModel from '../models/StockMovement';
import WarehouseModel from '../models/Warehouse';

type ObjId = mongoose.Types.ObjectId | string;

export async function getStock(orgId: ObjId, partId?: ObjId, warehouseId?: ObjId) {
  const filter: any = { orgId };
  if (partId) filter.partId = partId;
  if (warehouseId) filter.warehouseId = warehouseId;
  return StockModel.find(filter).lean();
}

export async function getOrCreateStock(orgId: ObjId, partId: ObjId, warehouseId: ObjId) {
  const filter = { orgId, partId, warehouseId };
  const update = { $setOnInsert: { quantity: 0, reserved: 0, createdAt: new Date() } };
  const opts = { upsert: true, new: true } as any;
  return StockModel.findOneAndUpdate(filter, update, opts).exec();
}

export async function reservePart(orgId: ObjId, partId: ObjId, warehouseId: ObjId, qty: number, referenceId?: ObjId, userId?: ObjId) {
  if (qty <= 0) throw new Error('qty must be positive');
  const stock = await getOrCreateStock(orgId, partId, warehouseId) as any;
  const available = (stock.quantity || 0) - (stock.reserved || 0);
  if (available < qty) throw new Error('insufficient stock to reserve');

  const updated = await StockModel.findOneAndUpdate(
    { _id: stock._id, orgId, partId, warehouseId, reserved: stock.reserved },
    { $inc: { reserved: qty } },
    { new: true }
  ).exec();

  await StockMovementModel.create({ orgId, partId, warehouseId, type: 'reserve', qty, referenceId, userId });
  return updated;
}

export async function consumePart(orgId: ObjId, partId: ObjId, warehouseId: ObjId, qty: number, referenceId?: ObjId, userId?: ObjId) {
  if (qty <= 0) throw new Error('qty must be positive');
  const stock = await getOrCreateStock(orgId, partId, warehouseId) as any;
  if ((stock.reserved || 0) < qty) throw new Error('not enough reserved quantity to consume');

  // decrement reserved and quantity
  const updated = await StockModel.findOneAndUpdate(
    { _id: stock._id, orgId, partId, warehouseId, reserved: stock.reserved },
    { $inc: { reserved: -qty, quantity: -qty } },
    { new: true }
  ).exec();

  await StockMovementModel.create({ orgId, partId, warehouseId, type: 'consume', qty, referenceId, userId });
  return updated;
}

export async function adjustStock(orgId: ObjId, partId: ObjId, warehouseId: ObjId, delta: number, referenceId?: ObjId, userId?: ObjId) {
  const stock = await getOrCreateStock(orgId, partId, warehouseId) as any;
  const updated = await StockModel.findOneAndUpdate(
    { _id: stock._id },
    { $inc: { quantity: delta } },
    { new: true }
  ).exec();
  await StockMovementModel.create({ orgId, partId, warehouseId, type: 'adjust', qty: delta, referenceId, userId });
  return updated;
}

export async function transferStock(orgId: ObjId, partId: ObjId, fromWarehouseId: ObjId, toWarehouseId: ObjId, qty: number, referenceId?: ObjId, userId?: ObjId) {
  if (qty <= 0) throw new Error('qty must be positive');
  if (String(fromWarehouseId) === String(toWarehouseId)) throw new Error('from and to warehouses must differ');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const from = await getOrCreateStock(orgId, partId, fromWarehouseId) as any;
    if ((from.quantity || 0) - (from.reserved || 0) < qty) throw new Error('insufficient stock to transfer');

    await StockModel.findOneAndUpdate({ _id: from._id }, { $inc: { quantity: -qty } }, { session }).exec();
    const to = await getOrCreateStock(orgId, partId, toWarehouseId) as any;
    await StockModel.findOneAndUpdate({ _id: to._id }, { $inc: { quantity: qty } }, { session, upsert: true }).exec();

    await StockMovementModel.create([{ orgId, partId, warehouseId: fromWarehouseId, toWarehouseId, type: 'transfer', qty, referenceId, userId }], { session });
    await session.commitTransaction();
    session.endSession();
    return true;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function listMovements(orgId: ObjId, filter: any = {}, limit = 50) {
  const f = { orgId, ...filter };
  return StockMovementModel.find(f).sort({ createdAt: -1 }).limit(limit).lean();
}

export default { getStock, getOrCreateStock, reservePart, consumePart, adjustStock, transferStock, listMovements };
