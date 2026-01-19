import { Request, Response } from 'express';
import Organization from '../models/Organization';

export async function getTemplate(req: any, res: Response) {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(400).json({ message: 'orgId missing' });
    const org = await Organization.findById(orgId).lean();
    const template = org?.meta?.reportingTemplate ?? { content: [{ text: 'Plantilla vacía' }] };
    return res.json({ template });
  } catch (err) {
    return res.status(500).json({ message: 'error' });
  }
}

export async function saveTemplate(req: any, res: Response) {
  try {
    if (!req.user?.isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const orgId = req.user?.orgId;
    if (!orgId) return res.status(400).json({ message: 'orgId missing' });
    const { template } = req.body;
    if (!template) return res.status(400).json({ message: 'template required' });

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    org.meta = org.meta || {};
    org.meta.reportingTemplate = template;
    await org.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error('saveTemplate error', err);
    return res.status(500).json({ message: 'error' });
  }
}
