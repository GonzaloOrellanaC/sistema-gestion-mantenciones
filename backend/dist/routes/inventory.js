"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Warehouse_1 = __importDefault(require("../models/Warehouse"));
const stockService_1 = __importDefault(require("../services/stockService"));
const router = express_1.default.Router();
// List warehouses for org
router.get('/warehouses', async (req, res, next) => {
    try {
        const orgId = req.query.orgId || req.body.orgId;
        if (!orgId)
            return res.status(400).json({ error: 'orgId required' });
        const data = await Warehouse_1.default.find({ orgId }).lean();
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
// Create warehouse
router.post('/warehouses', async (req, res, next) => {
    try {
        const { orgId, name, code, location, address, contact } = req.body;
        const w = await Warehouse_1.default.create({ orgId, name, code, location, address, contact });
        res.json(w);
    }
    catch (err) {
        next(err);
    }
});
// Get stock lines
router.get('/stock', async (req, res, next) => {
    try {
        const { orgId, partId, warehouseId } = req.query;
        if (!orgId)
            return res.status(400).json({ error: 'orgId required' });
        const data = await stockService_1.default.getStock(orgId, partId, warehouseId);
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
// Reserve part
router.post('/reserve', async (req, res, next) => {
    try {
        const { orgId, partId, warehouseId, qty, referenceId } = req.body;
        if (!orgId || !partId || !warehouseId || !qty)
            return res.status(400).json({ error: 'orgId, partId, warehouseId and qty required' });
        const updated = await stockService_1.default.reservePart(orgId, partId, warehouseId, Number(qty), referenceId);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// Consume part (from reserved)
router.post('/consume', async (req, res, next) => {
    try {
        const { orgId, partId, warehouseId, qty, referenceId } = req.body;
        if (!orgId || !partId || !warehouseId || !qty)
            return res.status(400).json({ error: 'orgId, partId, warehouseId and qty required' });
        const updated = await stockService_1.default.consumePart(orgId, partId, warehouseId, Number(qty), referenceId);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// Adjust stock
router.post('/adjust', async (req, res, next) => {
    try {
        const { orgId, partId, warehouseId, delta, referenceId } = req.body;
        if (!orgId || !partId || !warehouseId || typeof delta === 'undefined')
            return res.status(400).json({ error: 'orgId, partId, warehouseId and delta required' });
        const updated = await stockService_1.default.adjustStock(orgId, partId, warehouseId, Number(delta), referenceId);
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// Transfer stock
router.post('/transfer', async (req, res, next) => {
    try {
        const { orgId, partId, fromWarehouseId, toWarehouseId, qty, referenceId } = req.body;
        if (!orgId || !partId || !fromWarehouseId || !toWarehouseId || !qty)
            return res.status(400).json({ error: 'orgId, partId, fromWarehouseId, toWarehouseId and qty required' });
        const ok = await stockService_1.default.transferStock(orgId, partId, fromWarehouseId, toWarehouseId, Number(qty), referenceId);
        res.json({ ok });
    }
    catch (err) {
        next(err);
    }
});
// Movements
router.get('/movements', async (req, res, next) => {
    try {
        const { orgId, partId, limit } = req.query;
        if (!orgId)
            return res.status(400).json({ error: 'orgId required' });
        const data = await stockService_1.default.listMovements(orgId, { partId: partId }, Number(limit) || 50);
        res.json(data);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
