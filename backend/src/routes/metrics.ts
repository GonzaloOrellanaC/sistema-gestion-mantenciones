import express from 'express';
import { getPareto, getPrecomputedPareto } from '../controllers/metricsController';

const router = express.Router();

// GET /api/metrics/pareto/:type
router.get('/pareto/:type', getPareto);
// GET /api/metrics/precomputed
router.get('/precomputed', getPrecomputedPareto);

export default router;
