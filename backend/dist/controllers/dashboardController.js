"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.counts = counts;
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = require("mongoose");
const Branch_1 = __importDefault(require("../models/Branch"));
async function counts(req, res) {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(400).json({ message: 'orgId missing' });
        const orgObjId = mongoose_1.Types.ObjectId.isValid(orgId) ? new mongoose_1.Types.ObjectId(orgId) : orgId;
        const createdTotal = await WorkOrder_1.default.countDocuments({ orgId: orgObjId, deleted: { $ne: true } });
        const pendingTotal = await WorkOrder_1.default.countDocuments({ orgId: orgObjId, deleted: { $ne: true }, state: { $in: ['Asignado', 'Iniciado'] } });
        const activeUsers = await User_1.default.countDocuments({ orgId: orgObjId });
        // weekly counts (last 7 days, including today) - use aggregation for performance
        const today = new Date();
        const startRange = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6, 0, 0, 0);
        const endRange = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0);
        // aggregate by day string using dates.created or createdAt
        // include per-branch breakdown if more than one branch exists
        const branches = await Branch_1.default.find({ orgId: orgObjId }).lean();
        if (!branches || branches.length <= 1) {
            const agg = await WorkOrder_1.default.aggregate([
                { $match: { orgId: orgObjId, deleted: { $ne: true }, $or: [{ 'dates.created': { $gte: startRange, $lt: endRange } }, { createdAt: { $gte: startRange, $lt: endRange } }] } },
                { $project: { dayStr: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$dates.created', '$createdAt'] } } } } },
                { $group: { _id: '$dayStr', count: { $sum: 1 } } }
            ]).exec();
            const countsMap = (agg || []).reduce((acc, it) => {
                if (it && it._id)
                    acc[it._id] = it.count || 0;
                return acc;
            }, {});
            const weeklyCounts = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                weeklyCounts.push(countsMap[key] || 0);
            }
            return res.json({ createdTotal, pendingTotal, activeUsers, weeklyCounts });
        }
        // multiple branches: compute counts per branch
        const branchesCounts = [];
        for (const br of branches) {
            const brId = br._id;
            const created = await WorkOrder_1.default.countDocuments({ orgId: orgObjId, branchId: brId, deleted: { $ne: true } });
            const pending = await WorkOrder_1.default.countDocuments({ orgId: orgObjId, branchId: brId, deleted: { $ne: true }, state: { $in: ['Asignado', 'Iniciado'] } });
            const aggBr = await WorkOrder_1.default.aggregate([
                { $match: { orgId: orgObjId, branchId: brId, deleted: { $ne: true }, $or: [{ 'dates.created': { $gte: startRange, $lt: endRange } }, { createdAt: { $gte: startRange, $lt: endRange } }] } },
                { $project: { dayStr: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$dates.created', '$createdAt'] } } } } },
                { $group: { _id: '$dayStr', count: { $sum: 1 } } }
            ]).exec();
            const countsMap = (aggBr || []).reduce((acc, it) => {
                if (it && it._id)
                    acc[it._id] = it.count || 0;
                return acc;
            }, {});
            const weeklyCountsBr = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                weeklyCountsBr.push(countsMap[key] || 0);
            }
            branchesCounts.push({ _id: br._id, name: br.name, createdTotal: created, pendingTotal: pending, weeklyCounts: weeklyCountsBr });
        }
        return res.json({ createdTotal, pendingTotal, activeUsers, branches: branchesCounts });
    }
    catch (err) {
        console.error('dashboard counts err', err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
exports.default = { counts };
