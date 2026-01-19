import express from 'express';
import { Types } from 'mongoose';
import WarehouseModel from '../models/Warehouse';
import PartModel from '../models/Part';
import StockModel from '../models/Stock';
import stockService from '../services/stockService';

const router = express.Router();

// List warehouses for org
router.get('/warehouses', async (req, res, next) => {
  try {
    const orgId = req.query.orgId || req.body.orgId;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });
    const data = await WarehouseModel.find({ orgId }).lean();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Create warehouse
router.post('/warehouses', async (req, res, next) => {
  try {
    const { orgId, name, code, location, address, contact } = req.body;
    const w = await WarehouseModel.create({ orgId, name, code, location, address, contact });
    res.json(w);
  } catch (err) {
    next(err);
  }
});

// Get stock lines
router.get('/stock', async (req, res, next) => {
  try {
    const { orgId, partId, warehouseId } = req.query;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });
    const data = await stockService.getStock(orgId as string, partId as string | undefined, warehouseId as string | undefined);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Reserve part
router.post('/reserve', async (req, res, next) => {
  try {
    const { orgId, partId, warehouseId, qty, referenceId } = req.body;
    if (!orgId || !partId || !warehouseId || !qty) return res.status(400).json({ error: 'orgId, partId, warehouseId and qty required' });
    const updated = await stockService.reservePart(orgId, partId, warehouseId, Number(qty), referenceId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Consume part (from reserved)
router.post('/consume', async (req, res, next) => {
  try {
    const { orgId, partId, warehouseId, qty, referenceId } = req.body;
    if (!orgId || !partId || !warehouseId || !qty) return res.status(400).json({ error: 'orgId, partId, warehouseId and qty required' });
    const updated = await stockService.consumePart(orgId, partId, warehouseId, Number(qty), referenceId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Adjust stock
router.post('/adjust', async (req, res, next) => {
  try {
    const { orgId, partId, warehouseId, delta, referenceId } = req.body;
    if (!orgId || !partId || !warehouseId || typeof delta === 'undefined') return res.status(400).json({ error: 'orgId, partId, warehouseId and delta required' });
    const updated = await stockService.adjustStock(orgId, partId, warehouseId, Number(delta), referenceId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Transfer stock
router.post('/transfer', async (req, res, next) => {
  try {
    const { orgId, partId, fromWarehouseId, toWarehouseId, qty, referenceId } = req.body;
    if (!orgId || !partId || !fromWarehouseId || !toWarehouseId || !qty) return res.status(400).json({ error: 'orgId, partId, fromWarehouseId, toWarehouseId and qty required' });
    const ok = await stockService.transferStock(orgId, partId, fromWarehouseId, toWarehouseId, Number(qty), referenceId);
    res.json({ ok });
  } catch (err) {
    next(err);
  }
});

// Movements
router.get('/movements', async (req, res, next) => {
  try {
    const { orgId, partId, limit } = req.query;
    if (!orgId) return res.status(400).json({ error: 'orgId required' });
    const data = await stockService.listMovements(orgId as string, { partId: partId as string | undefined }, Number(limit) || 50);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
