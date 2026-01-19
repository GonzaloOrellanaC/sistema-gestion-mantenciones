"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStock = getStock;
exports.getOrCreateStock = getOrCreateStock;
exports.reservePart = reservePart;
exports.consumePart = consumePart;
exports.adjustStock = adjustStock;
exports.transferStock = transferStock;
exports.listMovements = listMovements;
const mongoose_1 = __importDefault(require("mongoose"));
const Stock_1 = __importDefault(require("../models/Stock"));
const StockMovement_1 = __importDefault(require("../models/StockMovement"));
async function getStock(orgId, partId, warehouseId) {
    const filter = { orgId };
    if (partId)
        filter.partId = partId;
    if (warehouseId)
        filter.warehouseId = warehouseId;
    return Stock_1.default.find(filter).lean();
}
async function getOrCreateStock(orgId, partId, warehouseId) {
    const filter = { orgId, partId, warehouseId };
    const update = { $setOnInsert: { quantity: 0, reserved: 0, createdAt: new Date() } };
    const opts = { upsert: true, new: true };
    return Stock_1.default.findOneAndUpdate(filter, update, opts).exec();
}
async function reservePart(orgId, partId, warehouseId, qty, referenceId, userId) {
    if (qty <= 0)
        throw new Error('qty must be positive');
    const stock = await getOrCreateStock(orgId, partId, warehouseId);
    const available = (stock.quantity || 0) - (stock.reserved || 0);
    if (available < qty)
        throw new Error('insufficient stock to reserve');
    const updated = await Stock_1.default.findOneAndUpdate({ _id: stock._id, orgId, partId, warehouseId, reserved: stock.reserved }, { $inc: { reserved: qty } }, { new: true }).exec();
    await StockMovement_1.default.create({ orgId, partId, warehouseId, type: 'reserve', qty, referenceId, userId });
    return updated;
}
async function consumePart(orgId, partId, warehouseId, qty, referenceId, userId) {
    if (qty <= 0)
        throw new Error('qty must be positive');
    const stock = await getOrCreateStock(orgId, partId, warehouseId);
    if ((stock.reserved || 0) < qty)
        throw new Error('not enough reserved quantity to consume');
    // decrement reserved and quantity
    const updated = await Stock_1.default.findOneAndUpdate({ _id: stock._id, orgId, partId, warehouseId, reserved: stock.reserved }, { $inc: { reserved: -qty, quantity: -qty } }, { new: true }).exec();
    await StockMovement_1.default.create({ orgId, partId, warehouseId, type: 'consume', qty, referenceId, userId });
    return updated;
}
async function adjustStock(orgId, partId, warehouseId, delta, referenceId, userId) {
    const stock = await getOrCreateStock(orgId, partId, warehouseId);
    const updated = await Stock_1.default.findOneAndUpdate({ _id: stock._id }, { $inc: { quantity: delta } }, { new: true }).exec();
    await StockMovement_1.default.create({ orgId, partId, warehouseId, type: 'adjust', qty: delta, referenceId, userId });
    return updated;
}
async function transferStock(orgId, partId, fromWarehouseId, toWarehouseId, qty, referenceId, userId) {
    if (qty <= 0)
        throw new Error('qty must be positive');
    if (String(fromWarehouseId) === String(toWarehouseId))
        throw new Error('from and to warehouses must differ');
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const from = await getOrCreateStock(orgId, partId, fromWarehouseId);
        if ((from.quantity || 0) - (from.reserved || 0) < qty)
            throw new Error('insufficient stock to transfer');
        await Stock_1.default.findOneAndUpdate({ _id: from._id }, { $inc: { quantity: -qty } }, { session }).exec();
        const to = await getOrCreateStock(orgId, partId, toWarehouseId);
        await Stock_1.default.findOneAndUpdate({ _id: to._id }, { $inc: { quantity: qty } }, { session, upsert: true }).exec();
        await StockMovement_1.default.create([{ orgId, partId, warehouseId: fromWarehouseId, toWarehouseId, type: 'transfer', qty, referenceId, userId }], { session });
        await session.commitTransaction();
        session.endSession();
        return true;
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}
async function listMovements(orgId, filter = {}, limit = 50) {
    const f = { orgId, ...filter };
    return StockMovement_1.default.find(f).sort({ createdAt: -1 }).limit(limit).lean();
}
exports.default = { getStock, getOrCreateStock, reservePart, consumePart, adjustStock, transferStock, listMovements };
