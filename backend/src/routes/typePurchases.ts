import express from 'express';
import { list } from '../controllers/typePurchasesController';

const router = express.Router();

// GET /api/type-purchases
router.get('/', list);

export default router;
