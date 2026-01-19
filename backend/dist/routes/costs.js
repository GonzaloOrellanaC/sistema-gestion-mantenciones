"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const costService_1 = __importDefault(require("../services/costService"));
const router = express_1.default.Router();
router.post('/', async (req, res, next) => {
    try {
        const { orgId, workOrderId, type, amount, description, currency, userId } = req.body;
        if (!orgId || !workOrderId || !type || typeof amount === 'undefined')
            return res.status(400).json({ error: 'orgId, workOrderId, type and amount required' });
        const item = await costService_1.default.addCostItem(orgId, workOrderId, type, Number(amount), description, currency, userId);
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
router.get('/work-order/:id', async (req, res, next) => {
    try {
        const orgId = req.query.orgId;
        const workOrderId = req.params.id;
        if (!orgId || !workOrderId)
            return res.status(400).json({ error: 'orgId and workOrderId required' });
        const items = await costService_1.default.listCostsByWorkOrder(orgId, workOrderId);
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
router.get('/work-order/:id/aggregate', async (req, res, next) => {
    try {
        const orgId = req.query.orgId;
        const workOrderId = req.params.id;
        if (!orgId || !workOrderId)
            return res.status(400).json({ error: 'orgId and workOrderId required' });
        const agg = await costService_1.default.aggregateCostsForWorkOrder(orgId, workOrderId);
        res.json(agg);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
