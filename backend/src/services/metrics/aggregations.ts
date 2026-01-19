import MaintenanceEvent from '../../models/MaintenanceEvent';
import Purchase from '../../models/Purchase';
import Asset from '../../models/Asset';
import Part from '../../models/Part';
import Supply from '../../models/Supply';
import mongoose from 'mongoose';

export async function maintenanceFrequencyByAsset(orgId: mongoose.Types.ObjectId, startDate: Date, endDate: Date, limit = 50) {
  const agg = await MaintenanceEvent.aggregate([
    { $match: { orgId: orgId, date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$assetId', value: { $sum: 1 } } },
    { $sort: { value: -1 } },
    { $limit: limit }
  ]);
  const ids = agg.map((a: any) => a._id).filter(Boolean);
  const assets = await Asset.find({ _id: { $in: ids } }).lean();
  const byId: any = {};
  assets.forEach((a: any) => (byId[a._id.toString()] = a));
  const total = agg.reduce((s: number, x: any) => s + x.value, 0) || 0;
  let cum = 0;
  return agg.map((a: any) => { cum += a.value; return { id: a._id, label: byId[a._id?.toString()]?.name || 'Activo desconocido', value: a.value, cumulativePct: total ? Math.round((cum/total)*10000)/100 : undefined }; });
}

export async function topPartsPurchases(orgId: mongoose.Types.ObjectId, startDate: Date, endDate: Date, limit = 50) {
  const agg = await Purchase.aggregate([
    { $match: { orgId: orgId, $or: [ { itemType: 'part' }, { acquisitionType: 'repuestos' } ], date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$itemId', value: { $sum: '$qty' } } },
    { $sort: { value: -1 } },
    { $limit: limit }
  ]);
  const ids = agg.map((a: any) => a._id).filter(Boolean);
  const parts = await Part.find({ _id: { $in: ids } }).lean();
  const byId: any = {};
  parts.forEach((p: any) => (byId[p._id.toString()] = p));
  const total = agg.reduce((s: number, x: any) => s + x.value, 0) || 0;
  let cum = 0;
  return agg.map((a: any) => { cum += a.value; return { id: a._id, label: byId[a._id?.toString()]?.name || 'Repuesto desconocido', value: a.value, cumulativePct: total ? Math.round((cum/total)*10000)/100 : undefined }; });
}

export async function topSuppliesPurchases(orgId: mongoose.Types.ObjectId, startDate: Date, endDate: Date, limit = 50) {
  const agg = await Purchase.aggregate([
    { $match: { orgId: orgId, $or: [ { itemType: 'supply' }, { acquisitionType: 'insumos' } ], date: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: '$itemId', value: { $sum: '$qty' } } },
    { $sort: { value: -1 } },
    { $limit: limit }
  ]);
  const ids = agg.map((a: any) => a._id).filter(Boolean);
  const subs = await Supply.find({ _id: { $in: ids } }).lean();
  const byId: any = {};
  subs.forEach((p: any) => (byId[p._id.toString()] = p));
  const total = agg.reduce((s: number, x: any) => s + x.value, 0) || 0;
  let cum = 0;
  return agg.map((a: any) => { cum += a.value; return { id: a._id, label: byId[a._id?.toString()]?.name || 'Insumo desconocido', value: a.value, cumulativePct: total ? Math.round((cum/total)*10000)/100 : undefined }; });
}
