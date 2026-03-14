"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Template_1 = __importDefault(require("../models/Template"));
const mongoose_1 = require("mongoose");
async function createTemplate(orgId, payload, createdBy) {
    const ensureComponentIds = (structure) => {
        if (!structure)
            return structure;
        const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const visit = (node) => {
            try {
                if (node && typeof node === 'object') {
                    if (Array.isArray(node.components)) {
                        node.components.forEach((c) => {
                            if (!c.id && !c._id)
                                c.id = genId();
                            visit(c);
                        });
                    }
                    if (Array.isArray(node.items))
                        node.items.forEach((it) => visit(it));
                    if (Array.isArray(node.columns))
                        node.columns.forEach((col) => { if (col && col.components)
                            col.components.forEach((c) => visit(c)); });
                }
            }
            catch (e) { /* ignore */ }
        };
        visit(structure);
        return structure;
    };
    // ensure structure components have stable ids before saving
    if (payload && payload.structure)
        payload.structure = ensureComponentIds(payload.structure);
    const doc = new Template_1.default({
        orgId,
        name: payload.name,
        description: payload.description,
        structure: payload.structure,
        previewConfigs: payload.previewConfigs || {},
        templateTypeId: payload.templateTypeId ? new mongoose_1.Types.ObjectId(payload.templateTypeId) : undefined,
        assignedAssets: Array.isArray(payload.assignedAssets) ? payload.assignedAssets.map(a => new mongoose_1.Types.ObjectId(a)) : [],
        isActive: payload.isActive !== false,
        execWindowMaxDays: typeof payload.execWindowMaxDays === 'number' ? payload.execWindowMaxDays : undefined,
        expectedDurationDays: typeof payload.expectedDurationDays === 'number' ? payload.expectedDurationDays : undefined,
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
        .populate('assignedAssets')
        .populate('templateTypeId')
        .lean();
    return { items, total, page, limit };
}
async function getTemplate(orgId, id) {
    if (!mongoose_1.Types.ObjectId.isValid(id))
        return null;
    return Template_1.default.findOne({ _id: id, orgId }).populate('assignedAssets').populate('templateTypeId').lean();
}
async function updateTemplate(orgId, id, payload, updatedBy) {
    if (!mongoose_1.Types.ObjectId.isValid(id))
        return null;
    const ensureComponentIds = (structure) => {
        if (!structure)
            return structure;
        const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const visit = (node) => {
            try {
                if (node && typeof node === 'object') {
                    if (Array.isArray(node.components)) {
                        node.components.forEach((c) => {
                            if (!c.id && !c._id)
                                c.id = genId();
                            visit(c);
                        });
                    }
                    if (Array.isArray(node.items))
                        node.items.forEach((it) => visit(it));
                    if (Array.isArray(node.columns))
                        node.columns.forEach((col) => { if (col && col.components)
                            col.components.forEach((c) => visit(c)); });
                }
            }
            catch (e) { /* ignore */ }
        };
        visit(structure);
        return structure;
    };
    // ensure structure components have stable ids before updating
    if (payload && payload.structure)
        payload.structure = ensureComponentIds(payload.structure);
    const update = {
        ...payload,
        updatedAt: new Date(),
    };
    if (payload.assignedAssets && Array.isArray(payload.assignedAssets)) {
        update.assignedAssets = payload.assignedAssets.map(a => new mongoose_1.Types.ObjectId(a));
    }
    if (updatedBy)
        update.updatedBy = new mongoose_1.Types.ObjectId(updatedBy);
    if (payload.templateTypeId)
        update.templateTypeId = new mongoose_1.Types.ObjectId(payload.templateTypeId);
    if (typeof payload.execWindowMaxDays === 'number')
        update.execWindowMaxDays = payload.execWindowMaxDays;
    if (typeof payload.expectedDurationDays === 'number')
        update.expectedDurationDays = payload.expectedDurationDays;
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
