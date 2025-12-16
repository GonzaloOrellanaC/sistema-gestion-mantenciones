import { Router } from 'express';
import * as countersController from '../controllers/countersController';

const router = Router();

// Returns next sequence number for an organization (orgId as param)
router.post('/:orgId/next', countersController.getNext);

export default router;
