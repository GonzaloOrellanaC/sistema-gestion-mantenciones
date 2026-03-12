import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/auth';
import * as importsController from '../controllers/importsController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

// POST /api/imports/excel -> multipart/form-data field 'file', optional field 'lang' (es|en)
router.post('/excel', upload.single('file'), (req, res) => importsController.importExcel(req, res));

export default router;
