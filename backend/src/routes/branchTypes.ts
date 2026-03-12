import { Router } from 'express';
import { getBranchTypes } from '../controllers/branchTypeController';

const router = Router();

// GET /api/branch-types
router.get('/', getBranchTypes);

export default router;
