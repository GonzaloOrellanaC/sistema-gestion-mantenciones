import Template from '../models/Template';
import { Types } from 'mongoose';

interface CreateTemplatePayload {
  name: string;
  description?: string;
  structure: any; // arbitrary JSON that defines the template
  previewConfigs?: any;
  isActive?: boolean;
}

async function createTemplate(orgId: string, payload: CreateTemplatePayload, createdBy?: string) {
  const doc = new Template({
    orgId,
    name: payload.name,
    description: payload.description,
    structure: payload.structure,
    previewConfigs: payload.previewConfigs || {},
    isActive: payload.isActive !== false,
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
    .lean();

  return { items, total, page, limit };
}

async function getTemplate(orgId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Template.findOne({ _id: id, orgId }).lean();
}

async function updateTemplate(orgId: string, id: string, payload: Partial<CreateTemplatePayload>, updatedBy?: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  const update: any = {
    ...payload,
    updatedAt: new Date(),
  };
  if (updatedBy) update.updatedBy = new Types.ObjectId(updatedBy);

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
