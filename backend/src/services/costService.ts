import CostItemModel from '../models/CostItem';
import mongoose from 'mongoose';

type ObjId = mongoose.Types.ObjectId | string;

export async function addCostItem(orgId: ObjId, workOrderId: ObjId, type: string, amount: number, description?: string, currency?: string, userId?: ObjId) {
  if (amount == null || Number.isNaN(Number(amount))) throw new Error('amount required');
  const item = await CostItemModel.create({ orgId, workOrderId, type, amount: Number(amount), description, currency, userId });
  return item;
}

export async function listCostsByWorkOrder(orgId: ObjId, workOrderId: ObjId) {
  return CostItemModel.find({ orgId, workOrderId }).sort({ createdAt: -1 }).lean();
}

export async function aggregateCostsForWorkOrder(orgId: ObjId, workOrderId: ObjId) {
  const res = await CostItemModel.aggregate([
    { $match: { orgId: new mongoose.Types.ObjectId(String(orgId)), workOrderId: new mongoose.Types.ObjectId(String(workOrderId)) } },
    { $group: { _id: '$currency', total: { $sum: '$amount' } } }
  ]).exec();
  return res;
}

export default { addCostItem, listCostsByWorkOrder, aggregateCostsForWorkOrder };
