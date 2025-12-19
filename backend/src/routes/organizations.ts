import { Router } from 'express';
import authMiddleware from '../middleware/auth';
import multer from 'multer';
import * as orgController from '../controllers/organizationController';

const router = Router();

router.use(authMiddleware);

// GET /api/organizations/ -> return current org
router.get('/', (req, res) => orgController.getOrganization(req, res));

// PUT /api/organizations/ -> update current org
router.put('/', (req, res) => orgController.updateOrganization(req, res));

// Upload organization images (logo / isotype)
// Accepts multipart/form-data with field 'file' and body 'type' = 'logo'|'isotype'
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1 * 1024 * 1024 } });
router.post('/upload', upload.single('file'), (req, res) => orgController.uploadImage(req, res));

export default router;
