import Template from '../models/Template';
import { Types } from 'mongoose';

interface CreateTemplatePayload {
  name: string;
  description?: string;
  structure: any; // arbitrary JSON that defines the template
  templateTypeId?: string;
  previewConfigs?: any;
  isActive?: boolean;
  assignedAssets?: string[];
  execWindowMaxDays?: number;
  expectedDurationDays?: number;
}

async function createTemplate(orgId: string, payload: CreateTemplatePayload, createdBy?: string) {
  const ensureComponentIds = (structure: any) => {
    if (!structure) return structure;
    const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    const visit = (node: any) => {
      try {
        if (node && typeof node === 'object') {
          if (Array.isArray(node.components)) {
            node.components.forEach((c: any) => {
              if (!c.id && !c._id) c.id = genId();
              visit(c);
            });
          }
          if (Array.isArray(node.items)) node.items.forEach((it: any) => visit(it));
          if (Array.isArray(node.columns)) node.columns.forEach((col: any) => { if (col && col.components) col.components.forEach((c: any) => visit(c)); });
        }
      } catch (e) { /* ignore */ }
    };
    visit(structure);
    return structure;
  };

  // ensure structure components have stable ids before saving
  if (payload && payload.structure) payload.structure = ensureComponentIds(payload.structure);

  const doc = new Template({
    orgId,
    name: payload.name,
    description: payload.description,
    structure: payload.structure,
    previewConfigs: payload.previewConfigs || {},
    templateTypeId: payload.templateTypeId ? new Types.ObjectId(payload.templateTypeId) : undefined,
    assignedAssets: Array.isArray(payload.assignedAssets) ? payload.assignedAssets.map(a => new Types.ObjectId(a)) : [],
    isActive: payload.isActive !== false,
    execWindowMaxDays: typeof payload.execWindowMaxDays === 'number' ? payload.execWindowMaxDays : undefined,
    expectedDurationDays: typeof payload.expectedDurationDays === 'number' ? payload.expectedDurationDays : undefined,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : undefined,
  });

  return doc.save();
}

async function listTemplates(orgId: string, opts?: { page?: number; limit?: number; q?: string }) {
  const page = Math.max(1, opts?.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts?.limit ?? 10));
  const q = (opts?.q || '').toString().trim();

  const filter: any = { orgId };
  if (q) {
    // simple text search on name and description
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { description: re }];
  }

  const total = await Template.countDocuments(filter);
  const items = await Template.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('assignedAssets')
    .populate('templateTypeId')
    .lean();

  return { items, total, page, limit };
}

async function getTemplate(orgId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Template.findOne({ _id: id, orgId }).populate('assignedAssets').populate('templateTypeId').lean();
}

async function updateTemplate(orgId: string, id: string, payload: Partial<CreateTemplatePayload>, updatedBy?: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  const ensureComponentIds = (structure: any) => {
    if (!structure) return structure;
    const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
    const visit = (node: any) => {
      try {
        if (node && typeof node === 'object') {
          if (Array.isArray(node.components)) {
            node.components.forEach((c: any) => {
              if (!c.id && !c._id) c.id = genId();
              visit(c);
            });
          }
          if (Array.isArray(node.items)) node.items.forEach((it: any) => visit(it));
          if (Array.isArray(node.columns)) node.columns.forEach((col: any) => { if (col && col.components) col.components.forEach((c: any) => visit(c)); });
        }
      } catch (e) { /* ignore */ }
    };
    visit(structure);
    return structure;
  };

  // ensure structure components have stable ids before updating
  if (payload && payload.structure) payload.structure = ensureComponentIds(payload.structure);

  const update: any = {
    ...payload,
    updatedAt: new Date(),
  };
  if (payload.assignedAssets && Array.isArray(payload.assignedAssets)) {
    update.assignedAssets = payload.assignedAssets.map(a => new Types.ObjectId(a));
  }
  if (updatedBy) update.updatedBy = new Types.ObjectId(updatedBy);

  if (payload.templateTypeId) update.templateTypeId = new Types.ObjectId(payload.templateTypeId as any);

  if (typeof payload.execWindowMaxDays === 'number') update.execWindowMaxDays = payload.execWindowMaxDays;
  if (typeof payload.expectedDurationDays === 'number') update.expectedDurationDays = payload.expectedDurationDays;

  // no assignment fields on templates (assignment belongs to work orders)

  return Template.findOneAndUpdate({ _id: id, orgId }, { $set: update }, { new: true }).lean();
}

async function deleteTemplate(orgId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Template.findOneAndDelete({ _id: id, orgId });
}

export default {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
};
