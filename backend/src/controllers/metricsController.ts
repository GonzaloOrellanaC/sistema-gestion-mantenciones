import { Request, Response } from 'express';
import mongoose from 'mongoose';
import MetricsPareto from '../models/MetricsPareto';
import * as aggs from '../services/metrics/aggregations';

function parseDate(q: any, fallback: Date) {
  if (!q) return fallback;
  const d = new Date(q);
  if (isNaN(d.getTime())) return fallback;
  return d;
}

export async function getPareto(req: Request, res: Response) {
  try {
    const orgId = new mongoose.Types.ObjectId(req.query.orgId as string || req.user?.orgId || req.body?.orgId);
    const type = req.params.type;
    const endDate = parseDate(req.query.end, new Date());
    const startDate = parseDate(req.query.start, new Date(Date.now() - 180*24*60*60*1000));
    // try to fetch precomputed first
    const cached = await MetricsPareto.findOne({ orgId, type, startDate, endDate }).sort({ generatedAt: -1 }).lean();
    if (cached) return res.json({ ok: true, data: cached });

    // compute on demand for supported types
    let items: any[] = [];
    if (type === 'maintenance-frequency') items = await aggs.maintenanceFrequencyByAsset(orgId, startDate, endDate, Number(req.query.limit || 50));
    else if (type === 'parts-purchases') items = await aggs.topPartsPurchases(orgId, startDate, endDate, Number(req.query.limit || 50));
    else if (type === 'supplies-purchases') items = await aggs.topSuppliesPurchases(orgId, startDate, endDate, Number(req.query.limit || 50));
    else return res.status(400).json({ ok: false, message: 'Unknown metric type' });

    return res.json({ ok: true, data: { type, startDate, endDate, items } });
  } catch (err) {
    console.error('getPareto error', err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}

export async function getPrecomputedPareto(req: Request, res: Response) {
  try {
    const orgId = new mongoose.Types.ObjectId(req.query.orgId as string || req.user?.orgId || req.body?.orgId);
    const rows = await MetricsPareto.find({ orgId }).sort({ generatedAt: -1 }).limit(20).lean();
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('getPrecomputedPareto error', err);
    return res.status(500).json({ ok: false });
  }
}
