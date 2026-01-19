import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authMiddleware from '../middleware/auth';
import FileMeta from '../models/FileMeta';
import WorkOrder from '../models/WorkOrder';

const router = Router();

// use env var or default
const FILES_DIR = process.env.FILES_DIR || path.join(process.cwd(), 'files');

const storage = multer.diskStorage({
  destination: async (req: any, file: any, cb: (err: Error | null, destination: string) => void) => {
    try {
      const orgId = req.user?.orgId || 'unknown';
      // If workOrderId provided prefer storing under files/{orgId}/{clientId}/{orgSeq}
      const workOrderId = req.body && req.body.workOrderId ? String(req.body.workOrderId) : undefined;
      if (workOrderId) {
        try {
          const wo = await WorkOrder.findOne({ _id: workOrderId, orgId }).lean();
          const clientId = (wo && wo.client && (wo.client._id || wo.client.id)) ? String((wo.client._id || wo.client.id)) : 'unknown-client';
          const seq = (wo && typeof wo.orgSeq !== 'undefined') ? String(wo.orgSeq) : String(workOrderId);
          const dir = path.join(FILES_DIR, String(orgId), clientId, seq);
          fs.mkdirSync(dir, { recursive: true });
          return cb(null, dir);
        } catch (e) {
          // fallback to default
        }
      }
      const type = (req.body.type as string) || 'misc';
      const dir = path.join(FILES_DIR, orgId.toString(), type);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (e: any) {
      cb(e instanceof Error ? e : new Error(String(e)), '');
    }
  },
  filename: (req: any, file: any, cb: (err: Error | null, filename: string) => void) => {
    try {
      const ts = Date.now();
      const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, `${ts}_${safe}`);
    } catch (e: any) {
      cb(e instanceof Error ? e : new Error(String(e)), '');
    }
  }
});

function fileFilter(req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = [
    'image/jpeg', 'image/png', 'image/jpg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  // reject unsupported mimetypes without throwing an error to the uploader
  return cb(null, false);
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

    // if uploader provided lot info, store in meta
    try {
      const lot = (req.body && (req.body.lot || req.body.lote)) ? (req.body.lot || req.body.lote) : undefined;
      const lotDateRaw = req.body && req.body.lotDate ? req.body.lotDate : (req.body && req.body.loteDate ? req.body.loteDate : undefined);
      if (lot || lotDateRaw) {
        metaData.meta = metaData.meta || {};
        if (lot) metaData.meta.lot = String(lot);
        if (lotDateRaw) {
          const d = new Date(lotDateRaw);
          if (!isNaN(d.getTime())) metaData.meta.lotDate = d;
        }
      }
    } catch (e) {
      /* ignore parse errors */
    }

    const meta = await FileMeta.create(metaData);

    // if workOrderId provided, attach
    const workOrderId = req.body.workOrderId;
    if (workOrderId) {
      await WorkOrder.findOneAndUpdate({ _id: workOrderId, orgId }, { $push: { attachments: meta._id } });
    }

    // compute public URL for the stored file (if under ./files)
    try {
      const filesBase = FILES_DIR; // base folder
      const rel = path.relative(filesBase, req.file.path).replace(/\\/g, '/');
      const publicUrl = `${req.protocol}://${req.get('host')}/files/${rel}`;
      meta.url = publicUrl;
      await meta.save();
    } catch (e) {
      // ignore
    }

    return res.json({ meta });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
});

export default router;
