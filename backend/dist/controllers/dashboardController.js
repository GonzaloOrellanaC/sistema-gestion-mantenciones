"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.counts = counts;
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
const workOrderStates_1 = require("../utils/workOrderStates");
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = require("mongoose");
const Branch_1 = __importDefault(require("../models/Branch"));
const TemplateType_1 = __importDefault(require("../models/TemplateType"));
async function counts(req, res) {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(400).json({ message: 'orgId missing' });
        const orgObjId = mongoose_1.Types.ObjectId.isValid(orgId) ? new mongoose_1.Types.ObjectId(orgId) : orgId;
        const createdTotal = await WorkOrder_1.default.countDocuments({ orgId: orgObjId, deleted: { $ne: true } });
        const pendingTotal = await WorkOrder_1.default.countDocuments({ orgId: orgObjId, deleted: { $ne: true }, state: { $in: [workOrderStates_1.WORK_ORDER_STATES.ASSIGNED, workOrderStates_1.WORK_ORDER_STATES.STARTED] } });
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
            // low-stock counts computed from inventories (sum remainingQuantity per item and compare to minStock)
            const partsLowAgg = await (await Promise.resolve().then(() => __importStar(require('../models/PartInventory')))).default.aggregate([
                { $match: { orgId: orgObjId } },
                { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' } } },
                { $lookup: { from: 'parts', localField: '_id', foreignField: '_id', as: 'part' } },
                { $unwind: { path: '$part', preserveNullAndEmptyArrays: true } },
                { $project: { remaining: 1, minStock: { $ifNull: ['$part.minStock', 0] } } },
                { $match: { $expr: { $or: [{ $lte: ['$remaining', 0] }, { $lt: ['$remaining', '$minStock'] }] } } },
                { $count: 'count' }
            ]).catch(() => []);
            const partsLowStock = (partsLowAgg && partsLowAgg[0] && partsLowAgg[0].count) ? partsLowAgg[0].count : 0;
            const suppliesLowAgg = await (await Promise.resolve().then(() => __importStar(require('../models/SupplyInventory')))).default.aggregate([
                { $match: { orgId: orgObjId } },
                { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' } } },
                { $lookup: { from: 'supplies', localField: '_id', foreignField: '_id', as: 'supply' } },
                { $unwind: { path: '$supply', preserveNullAndEmptyArrays: true } },
                { $project: { remaining: 1, minStock: { $ifNull: ['$supply.minStock', 0] } } },
                { $match: { $expr: { $or: [{ $lte: ['$remaining', 0] }, { $lt: ['$remaining', '$minStock'] }] } } },
                { $count: 'count' }
            ]).catch(() => []);
            const suppliesLowStock = (suppliesLowAgg && suppliesLowAgg[0] && suppliesLowAgg[0].count) ? suppliesLowAgg[0].count : 0;
            // compute monthly status and work orders by template type
            const monthsParam = parseInt(req.query.months || '6', 10);
            const months = Math.min(Math.max(monthsParam, 1), 12);
            const now = new Date();
            const startMonth = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1, 0, 0, 0);
            const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
            const monthlyAgg = await WorkOrder_1.default.aggregate([
                { $match: { orgId: orgObjId, deleted: { $ne: true }, $or: [{ 'dates.created': { $gte: startMonth, $lt: endMonth } }, { createdAt: { $gte: startMonth, $lt: endMonth } }] } },
                { $project: {
                        monthStr: { $dateToString: { format: '%Y-%m', date: { $ifNull: ['$dates.created', '$createdAt'] } } },
                        state: '$state',
                        estimatedEnd: '$dates.estimatedEnd'
                    } },
                { $group: {
                        _id: '$monthStr',
                        completed: { $sum: { $cond: [{ $eq: ['$state', workOrderStates_1.WORK_ORDER_STATES.APPROVED] }, 1, 0] } },
                        in_progress: { $sum: { $cond: [{ $in: ['$state', [workOrderStates_1.WORK_ORDER_STATES.ASSIGNED, workOrderStates_1.WORK_ORDER_STATES.STARTED, workOrderStates_1.WORK_ORDER_STATES.UNDER_REVIEW]] }, 1, 0] } },
                        delayed: { $sum: { $cond: [{ $and: [{ $ne: ['$state', workOrderStates_1.WORK_ORDER_STATES.APPROVED] }, { $lt: [{ $ifNull: ['$estimatedEnd', new Date(0)] }, new Date()] }] }, 1, 0] } }
                    } },
                { $sort: { _id: 1 } }
            ]).exec();
            const monthlyMap = {};
            (monthlyAgg || []).forEach((it) => { monthlyMap[it._id] = { completed: it.completed || 0, in_progress: it.in_progress || 0, delayed: it.delayed || 0 }; });
            const monthlyStatus = [];
            for (let m = months - 1; m >= 0; m--) {
                const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const vals = monthlyMap[key] || { completed: 0, in_progress: 0, delayed: 0 };
                monthlyStatus.push({ month: key, ...vals });
            }
            const byTypeAgg = await WorkOrder_1.default.aggregate([
                { $match: { orgId: orgObjId, deleted: { $ne: true } } },
                { $lookup: { from: 'templates', localField: 'templateId', foreignField: '_id', as: 'template' } },
                { $unwind: { path: '$template', preserveNullAndEmptyArrays: true } },
                { $group: { _id: '$template.templateTypeId', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]).exec();
            const woByTemplateType = [];
            for (const it of (byTypeAgg || [])) {
                if (it._id) {
                    const tt = await TemplateType_1.default.findById(it._id).lean();
                    woByTemplateType.push({ templateTypeId: it._id, label: tt?.name || 'Sin tipo', count: it.count });
                }
                else {
                    woByTemplateType.push({ templateTypeId: null, label: 'Sin tipo', count: it.count });
                }
            }
            return res.json({ createdTotal, pendingTotal, activeUsers, weeklyCounts, partsLowStock, suppliesLowStock, monthlyStatus, woByTemplateType });
        }
        // multiple branches: compute counts per branch
        const branchesCounts = [];
        for (const br of branches) {
            const brId = br._id;
            const created = await WorkOrder_1.default.countDocuments({ orgId: orgObjId, branchId: brId, deleted: { $ne: true } });
            const pending = await WorkOrder_1.default.countDocuments({ orgId: orgObjId, branchId: brId, deleted: { $ne: true }, state: { $in: [workOrderStates_1.WORK_ORDER_STATES.ASSIGNED, workOrderStates_1.WORK_ORDER_STATES.STARTED] } });
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
        // compute low-stock per org as well (from inventories)
        const partsLowAgg2 = await (await Promise.resolve().then(() => __importStar(require('../models/PartInventory')))).default.aggregate([
            { $match: { orgId: orgObjId } },
            { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' } } },
            { $lookup: { from: 'parts', localField: '_id', foreignField: '_id', as: 'part' } },
            { $unwind: { path: '$part', preserveNullAndEmptyArrays: true } },
            { $project: { remaining: 1, minStock: { $ifNull: ['$part.minStock', 0] } } },
            { $match: { $expr: { $lte: ['$remaining', '$minStock'] } } },
            { $count: 'count' }
        ]).catch(() => []);
        const partsLowStock = (partsLowAgg2 && partsLowAgg2[0] && partsLowAgg2[0].count) ? partsLowAgg2[0].count : 0;
        const suppliesLowAgg2 = await (await Promise.resolve().then(() => __importStar(require('../models/SupplyInventory')))).default.aggregate([
            { $match: { orgId: orgObjId } },
            { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' } } },
            { $lookup: { from: 'supplies', localField: '_id', foreignField: '_id', as: 'supply' } },
            { $unwind: { path: '$supply', preserveNullAndEmptyArrays: true } },
            { $project: { remaining: 1, minStock: { $ifNull: ['$supply.minStock', 0] } } },
            { $match: { $expr: { $lte: ['$remaining', '$minStock'] } } },
            { $count: 'count' }
        ]).catch(() => []);
        const suppliesLowStock = (suppliesLowAgg2 && suppliesLowAgg2[0] && suppliesLowAgg2[0].count) ? suppliesLowAgg2[0].count : 0;
        // compute monthly status and work orders by template type (same as single-branch path)
        const monthsParam = parseInt(req.query.months || '6', 10);
        const months = Math.min(Math.max(monthsParam, 1), 12);
        const now = new Date();
        const startMonth = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1, 0, 0, 0);
        const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
        const monthlyAgg = await WorkOrder_1.default.aggregate([
            { $match: { orgId: orgObjId, deleted: { $ne: true }, $or: [{ 'dates.created': { $gte: startMonth, $lt: endMonth } }, { createdAt: { $gte: startMonth, $lt: endMonth } }] } },
            { $project: {
                    monthStr: { $dateToString: { format: '%Y-%m', date: { $ifNull: ['$dates.created', '$createdAt'] } } },
                    state: '$state',
                    estimatedEnd: '$dates.estimatedEnd'
                } },
            { $group: {
                    _id: '$monthStr',
                    completed: { $sum: { $cond: [{ $eq: ['$state', workOrderStates_1.WORK_ORDER_STATES.APPROVED] }, 1, 0] } },
                    in_progress: { $sum: { $cond: [{ $in: ['$state', [workOrderStates_1.WORK_ORDER_STATES.ASSIGNED, workOrderStates_1.WORK_ORDER_STATES.STARTED, workOrderStates_1.WORK_ORDER_STATES.UNDER_REVIEW]] }, 1, 0] } },
                    delayed: { $sum: { $cond: [{ $and: [{ $ne: ['$state', workOrderStates_1.WORK_ORDER_STATES.APPROVED] }, { $lt: [{ $ifNull: ['$estimatedEnd', new Date(0)] }, new Date()] }] }, 1, 0] } }
                } },
            { $sort: { _id: 1 } }
        ]).exec();
        const monthlyMap = {};
        (monthlyAgg || []).forEach((it) => { monthlyMap[it._id] = { completed: it.completed || 0, in_progress: it.in_progress || 0, delayed: it.delayed || 0 }; });
        const monthlyStatus = [];
        for (let m = months - 1; m >= 0; m--) {
            const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const vals = monthlyMap[key] || { completed: 0, in_progress: 0, delayed: 0 };
            monthlyStatus.push({ month: key, ...vals });
        }
        const byTypeAgg = await WorkOrder_1.default.aggregate([
            { $match: { orgId: orgObjId, deleted: { $ne: true } } },
            { $lookup: { from: 'templates', localField: 'templateId', foreignField: '_id', as: 'template' } },
            { $unwind: { path: '$template', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$template.templateTypeId', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).exec();
        const woByTemplateType = [];
        for (const it of (byTypeAgg || [])) {
            if (it._id) {
                const tt = await TemplateType_1.default.findById(it._id).lean();
                woByTemplateType.push({ templateTypeId: it._id, label: tt?.name || 'Sin tipo', count: it.count });
            }
            else {
                woByTemplateType.push({ templateTypeId: null, label: 'Sin tipo', count: it.count });
            }
        }
        return res.json({ createdTotal, pendingTotal, activeUsers, branches: branchesCounts, partsLowStock, suppliesLowStock, monthlyStatus, woByTemplateType });
    }
    catch (err) {
        console.error('dashboard counts err', err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
exports.default = { counts };
