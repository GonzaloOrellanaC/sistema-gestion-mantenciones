import { Request, Response } from 'express';
import Organization from '../models/Organization';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function getOrganization(req: Request, res: Response) {
  try {
    const orgId = (req as any).user?.orgId;
    if (!orgId) return res.status(400).json({ message: 'No orgId in token' });
    const org = await Organization.findById(orgId).lean();
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    return res.json(org);
  } catch (err: any) {
    console.error('getOrganization error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function updateOrganization(req: Request, res: Response) {
  try {
    const orgId = (req as any).user?.orgId;
    if (!orgId) return res.status(400).json({ message: 'No orgId in token' });

    const allowed: any = {};
    const { name, meta, address, contact, contactEmail, contactPhone, logoUrl } = req.body;
    if (typeof name === 'string') allowed.name = name;

    // start with provided meta object if any
    if (typeof meta === 'object' && meta !== null) {
      allowed.meta = meta;
    }

    // address may be provided separately
    if (typeof address !== 'undefined') allowed.meta = { ...(allowed.meta || {}), address };

    // contact may come as object { email, phone } or as separate fields
    if (typeof contact === 'object' && contact !== null) {
      allowed.meta = { ...(allowed.meta || {}), contact };
    } else {
      const cEmail = typeof contactEmail === 'string' ? contactEmail : undefined;
      const cPhone = typeof contactPhone === 'string' ? contactPhone : undefined;
      if (cEmail !== undefined || cPhone !== undefined) {
        const existing = (allowed.meta && allowed.meta.contact) || {};
        allowed.meta = { ...(allowed.meta || {}), contact: { ...existing, ...(cEmail !== undefined ? { email: cEmail } : {}), ...(cPhone !== undefined ? { phone: cPhone } : {}) } };
      }
      // if contact sent as plain string, preserve as phone fallback
      if (typeof contact === 'string') {
        const existing = (allowed.meta && allowed.meta.contact) || {};
        allowed.meta = { ...(allowed.meta || {}), contact: { ...existing, phone: contact } };
      }
    }

    if (typeof logoUrl === 'string') allowed.meta = { ...(allowed.meta || {}), logoUrl };

    const org = await Organization.findOneAndUpdate({ _id: orgId }, { $set: allowed }, { new: true }).lean();
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    return res.json(org);
  } catch (err: any) {
    console.error('updateOrganization error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

export default {
  getOrganization,
  updateOrganization,
  // uploadImage will be attached via routes
};

export async function uploadImage(req: Request, res: Response) {
  try {
    const orgId = (req as any).user?.orgId;
    if (!orgId) return res.status(400).json({ message: 'No orgId in token' });

    const file = (req as any).file;
    const type = (req as any).body?.type || req.query?.type; // 'logo' or 'isotype'
    if (!file) return res.status(400).json({ message: 'No file uploaded' });
    if (!type || (type !== 'logo' && type !== 'isotype')) return res.status(400).json({ message: 'Invalid type' });

    // validate mimetype
    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.mimetype)) return res.status(400).json({ message: 'Only JPG/PNG allowed' });

    // check size (multer should enforce, but double-check)
    const MAX_BYTES = 1 * 1024 * 1024; // 1MB
    if (file.size > MAX_BYTES) return res.status(400).json({ message: 'File too large (max 1MB)' });

    // validate dimensions via sharp
    const image = sharp(file.buffer);
    const meta = await image.metadata();
    const width = meta.width || 0;
    const height = meta.height || 0;

    if (type === 'logo') {
      if (width > 1080 || height > 400) return res.status(400).json({ message: 'Logo dimensions exceed allowed maximum (1080x400)' });
    } else {
      // isotype
      if (width > 600 || height > 600) return res.status(400).json({ message: 'Isotype dimensions exceed allowed maximum (600x600)' });
    }

    // build paths: backend/files/images/{orgId}/{type}/
    const baseDir = path.join(__dirname, '..', '..', 'files', 'images');
    const orgDir = path.join(baseDir, String(orgId));
    const typeDir = path.join(orgDir, String(type));

    // ensure directories
    fs.mkdirSync(typeDir, { recursive: true });

    // filename: Date.now() + ext
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    const filename = `${Date.now()}${ext}`;
    const outPath = path.join(typeDir, filename);

    // write file buffer to disk (ensure proper encoding)
    await image.toFile(outPath);

    // public URL: /images/{orgId}/{type}/{filename}
    const relativeUrl = `/images/${orgId}/${type}/${filename}`;
    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    // update org meta field with absolute URL
    const org = await Organization.findById(orgId);
    if (org) {
      const metaObj = (org.meta && typeof org.meta === 'object') ? org.meta : {};
      if (type === 'logo') metaObj.logoUrl = fullUrl;
      else metaObj.isotypeUrl = fullUrl;
      org.meta = metaObj;
      await org.save();
    }

    return res.json({ url: fullUrl, org });
  } catch (err: any) {
    console.error('uploadImage error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
