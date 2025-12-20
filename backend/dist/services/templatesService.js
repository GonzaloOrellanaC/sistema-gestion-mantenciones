"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Template_1 = __importDefault(require("../models/Template"));
const mongoose_1 = require("mongoose");
async function createTemplate(orgId, payload, createdBy) {
    const doc = new Template_1.default({
        orgId,
        name: payload.name,
        description: payload.description,
        structure: payload.structure,
        previewConfigs: payload.previewConfigs || {},
        isActive: payload.isActive !== false,
        createdBy: createdBy ? new mongoose_1.Types.ObjectId(createdBy) : undefined,
    });
    return doc.save();
}
async function listTemplates(orgId, opts) {
    const page = Math.max(1, opts?.page ?? 1);
    const limit = Math.max(1, Math.min(100, opts?.limit ?? 10));
    const q = (opts?.q || '').toString().trim();
    const filter = { orgId };
    if (q) {
        // simple text search on name and description
        const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ name: re }, { description: re }];
    }
    const total = await Template_1.default.countDocuments(filter);
    const items = await Template_1.default.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return { items, total, page, limit };
}
async function getTemplate(orgId, id) {
    if (!mongoose_1.Types.ObjectId.isValid(id))
        return null;
    return Template_1.default.findOne({ _id: id, orgId }).lean();
}
async function updateTemplate(orgId, id, payload, updatedBy) {
    if (!mongoose_1.Types.ObjectId.isValid(id))
        return null;
    const update = {
        ...payload,
        updatedAt: new Date(),
    };
    if (updatedBy)
        update.updatedBy = new mongoose_1.Types.ObjectId(updatedBy);
    // no assignment fields on templates (assignment belongs to work orders)
    return Template_1.default.findOneAndUpdate({ _id: id, orgId }, { $set: update }, { new: true }).lean();
}
async function deleteTemplate(orgId, id) {
    if (!mongoose_1.Types.ObjectId.isValid(id))
        return null;
    return Template_1.default.findOneAndDelete({ _id: id, orgId });
}
exports.default = {
    createTemplate,
    listTemplates,
    getTemplate,
    updateTemplate,
    deleteTemplate,
};
