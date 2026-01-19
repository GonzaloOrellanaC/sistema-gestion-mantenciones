"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCostItem = addCostItem;
exports.listCostsByWorkOrder = listCostsByWorkOrder;
exports.aggregateCostsForWorkOrder = aggregateCostsForWorkOrder;
const CostItem_1 = __importDefault(require("../models/CostItem"));
const mongoose_1 = __importDefault(require("mongoose"));
async function addCostItem(orgId, workOrderId, type, amount, description, currency, userId) {
    if (amount == null || Number.isNaN(Number(amount)))
        throw new Error('amount required');
    const item = await CostItem_1.default.create({ orgId, workOrderId, type, amount: Number(amount), description, currency, userId });
    return item;
}
async function listCostsByWorkOrder(orgId, workOrderId) {
    return CostItem_1.default.find({ orgId, workOrderId }).sort({ createdAt: -1 }).lean();
}
async function aggregateCostsForWorkOrder(orgId, workOrderId) {
    const res = await CostItem_1.default.aggregate([
        { $match: { orgId: new mongoose_1.default.Types.ObjectId(String(orgId)), workOrderId: new mongoose_1.default.Types.ObjectId(String(workOrderId)) } },
        { $group: { _id: '$currency', total: { $sum: '$amount' } } }
    ]).exec();
    return res;
}
exports.default = { addCostItem, listCostsByWorkOrder, aggregateCostsForWorkOrder };
