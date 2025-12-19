import { Request, Response } from 'express';
import WorkOrder from '../models/WorkOrder';
import User from '../models/User';
import { Types } from 'mongoose';
import Branch from '../models/Branch';

export async function counts(req: Request, res: Response) {
  try {
    const orgId = (req as any).user?.orgId;
    if (!orgId) return res.status(400).json({ message: 'orgId missing' });

    const orgObjId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;

    const createdTotal = await WorkOrder.countDocuments({ orgId: orgObjId, deleted: { $ne: true } });
    const pendingTotal = await WorkOrder.countDocuments({ orgId: orgObjId, deleted: { $ne: true }, state: { $in: ['Asignado', 'Iniciado'] } });
    const activeUsers = await User.countDocuments({ orgId: orgObjId });

    // weekly counts (last 7 days, including today) - use aggregation for performance
    const today = new Date();
    const startRange = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6, 0, 0, 0);
    const endRange = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0);

    // aggregate by day string using dates.created or createdAt
    // include per-branch breakdown if more than one branch exists
    const branches = await Branch.find({ orgId: orgObjId }).lean();
    if (!branches || branches.length <= 1) {
      const agg: any[] = await WorkOrder.aggregate([
        { $match: { orgId: orgObjId, deleted: { $ne: true }, $or: [ { 'dates.created': { $gte: startRange, $lt: endRange } }, { createdAt: { $gte: startRange, $lt: endRange } } ] } },
        { $project: { dayStr: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: [ '$dates.created', '$createdAt' ] } } } } },
        { $group: { _id: '$dayStr', count: { $sum: 1 } } }
      ]).exec();

      const countsMap: Record<string, number> = (agg || []).reduce((acc: Record<string, number>, it: any) => {
        if (it && it._id) acc[it._id] = it.count || 0;
        return acc;
      }, {});

      const weeklyCounts: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        weeklyCounts.push(countsMap[key] || 0);
      }

      return res.json({ createdTotal, pendingTotal, activeUsers, weeklyCounts });
    }

    // multiple branches: compute counts per branch
    const branchesCounts: any[] = [];
    for (const br of branches) {
      const brId = br._id;
      const created = await WorkOrder.countDocuments({ orgId: orgObjId, branchId: brId, deleted: { $ne: true } });
      const pending = await WorkOrder.countDocuments({ orgId: orgObjId, branchId: brId, deleted: { $ne: true }, state: { $in: ['Asignado', 'Iniciado'] } });

      const aggBr: any[] = await WorkOrder.aggregate([
        { $match: { orgId: orgObjId, branchId: brId, deleted: { $ne: true }, $or: [ { 'dates.created': { $gte: startRange, $lt: endRange } }, { createdAt: { $gte: startRange, $lt: endRange } } ] } },
        { $project: { dayStr: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: [ '$dates.created', '$createdAt' ] } } } } },
        { $group: { _id: '$dayStr', count: { $sum: 1 } } }
      ]).exec();

      const countsMap: Record<string, number> = (aggBr || []).reduce((acc: Record<string, number>, it: any) => {
        if (it && it._id) acc[it._id] = it.count || 0;
        return acc;
      }, {});

      const weeklyCountsBr: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        weeklyCountsBr.push(countsMap[key] || 0);
      }

      branchesCounts.push({ _id: br._id, name: br.name, createdTotal: created, pendingTotal: pending, weeklyCounts: weeklyCountsBr });
    }

    return res.json({ createdTotal, pendingTotal, activeUsers, branches: branchesCounts });
  } catch (err: any) {
    console.error('dashboard counts err', err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

export default { counts };
