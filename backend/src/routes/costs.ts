import express from 'express';
import costService from '../services/costService';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { orgId, workOrderId, type, amount, description, currency, userId } = req.body;
    if (!orgId || !workOrderId || !type || typeof amount === 'undefined') return res.status(400).json({ error: 'orgId, workOrderId, type and amount required' });
    const item = await costService.addCostItem(orgId, workOrderId, type, Number(amount), description, currency, userId);
    res.json(item);
  } catch (err) { next(err); }
});

router.get('/work-order/:id', async (req, res, next) => {
  try {
    const orgId = req.query.orgId as string;
    const workOrderId = req.params.id;
    if (!orgId || !workOrderId) return res.status(400).json({ error: 'orgId and workOrderId required' });
    const items = await costService.listCostsByWorkOrder(orgId, workOrderId);
    res.json(items);
  } catch (err) { next(err); }
});

router.get('/work-order/:id/aggregate', async (req, res, next) => {
  try {
    const orgId = req.query.orgId as string;
    const workOrderId = req.params.id;
    if (!orgId || !workOrderId) return res.status(400).json({ error: 'orgId and workOrderId required' });
    const agg = await costService.aggregateCostsForWorkOrder(orgId, workOrderId);
    res.json(agg);
  } catch (err) { next(err); }
});

export default router;
