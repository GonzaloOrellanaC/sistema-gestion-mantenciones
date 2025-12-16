import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authMiddleware from '../middleware/auth';
import FileMeta from '../models/FileMeta';
import WorkOrder from '../models/WorkOrder';

const router = Router();

// use env var or default
const FILES_DIR = process.env.FILES_DIR || path.join(process.cwd(), 'backend', 'files');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const orgId = req.user?.orgId || 'unknown';
      const type = (req.body.type as string) || 'misc';
      const dir = path.join(FILES_DIR, orgId.toString(), type);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (e) {
      cb(e as any, '');
    }
  },
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${ts}_${safe}`);
  }
});

function fileFilter(req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = [
    'image/jpeg', 'image/png', 'image/jpg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Invalid file type'), false);
}

export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

router.use(authMiddleware);

// upload file and optionally attach to a work order
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    if (!req.file) return res.status(400).json({ message: 'No file' });

    const metaData: any = {
      orgId,
      uploaderId: req.user?.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storage: 'local',
      path: req.file.path
    };

    // if image, create thumbnail (optional)
    if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
      const { generateThumbnail } = await import('../utils/image');
      const thumbName = `thumb_${req.file.filename}`;
      const thumbPath = path.join(path.dirname(req.file.path), thumbName);
      try {
        await generateThumbnail(req.file.path, thumbPath, 300);
        metaData.meta = { thumbnailPath: thumbPath };
      } catch (e) {
        console.warn('thumbnail generation failed', e);
      }
    }

    const meta = await FileMeta.create(metaData);

    // if workOrderId provided, attach
    const workOrderId = req.body.workOrderId;
    if (workOrderId) {
      await WorkOrder.findOneAndUpdate({ _id: workOrderId, orgId }, { $push: { attachments: meta._id } });
    }

    return res.json({ meta });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
});

export default router;
