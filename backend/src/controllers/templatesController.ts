import { Request, Response } from 'express';
import templatesService from '../services/templatesService';

async function createTemplate(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });

  const payload = req.body;
  try {
    const doc = await templatesService.createTemplate(orgId.toString(), payload, req.user?.id);
    return res.status(201).json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function listTemplates(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  try {
    const page = parseInt((req.query.page as string) || '1', 10) || 1;
    const limit = parseInt((req.query.limit as string) || '10', 10) || 10;
    const q = (req.query.q as string) || undefined;
    const docs = await templatesService.listTemplates(orgId.toString(), { page, limit, q });
    return res.json(docs);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function getTemplate(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  try {
    const doc = await templatesService.getTemplate(orgId.toString(), id);
    if (!doc) return res.status(404).json({ message: 'Template not found' });
    return res.json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function previewTemplate(req: Request, res: Response) {
  // Preview currently returns the template structure and previewConfigs so frontend can render it
  const orgId = req.user?.orgId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  try {
    const doc = await templatesService.getTemplate(orgId.toString(), id);
    if (!doc) return res.status(404).json({ message: 'Template not found' });

    // Optionally accept a device query param (desktop|tablet|mobile)
    const device = (req.query.device as string) || 'desktop';
    return res.json({ structure: doc.structure, previewConfigs: doc.previewConfigs || {}, device });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function updateTemplate(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  const payload = req.body;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  try {
    const doc = await templatesService.updateTemplate(orgId.toString(), id, payload, req.user?.id);
    if (!doc) return res.status(404).json({ message: 'Template not found' });
    return res.json(doc);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

async function deleteTemplate(req: Request, res: Response) {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: 'orgId missing' });
  try {
    const doc = await templatesService.deleteTemplate(orgId.toString(), id);
    if (!doc) return res.status(404).json({ message: 'Template not found' });
    return res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'server error' });
  }
}

export default {
  createTemplate,
  listTemplates,
  getTemplate,
  previewTemplate,
  updateTemplate,
  deleteTemplate,
};
