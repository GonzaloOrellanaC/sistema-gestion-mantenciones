"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const templatesService_1 = __importDefault(require("../services/templatesService"));
async function createTemplate(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    const payload = req.body;
    try {
        const doc = await templatesService_1.default.createTemplate(orgId.toString(), payload, req.user?.id);
        return res.status(201).json(doc);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function listTemplates(req, res) {
    const orgId = req.user?.orgId;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    try {
        const page = parseInt(req.query.page || '1', 10) || 1;
        const limit = parseInt(req.query.limit || '10', 10) || 10;
        const q = req.query.q || undefined;
        const docs = await templatesService_1.default.listTemplates(orgId.toString(), { page, limit, q });
        return res.json(docs);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function getTemplate(req, res) {
    const orgId = req.user?.orgId;
    const { id } = req.params;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    try {
        const doc = await templatesService_1.default.getTemplate(orgId.toString(), id);
        if (!doc)
            return res.status(404).json({ message: 'Template not found' });
        return res.json(doc);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function previewTemplate(req, res) {
    // Preview currently returns the template structure and previewConfigs so frontend can render it
    const orgId = req.user?.orgId;
    const { id } = req.params;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    try {
        const doc = await templatesService_1.default.getTemplate(orgId.toString(), id);
        if (!doc)
            return res.status(404).json({ message: 'Template not found' });
        // Optionally accept a device query param (desktop|tablet|mobile)
        const device = req.query.device || 'desktop';
        return res.json({ structure: doc.structure, previewConfigs: doc.previewConfigs || {}, device });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function updateTemplate(req, res) {
    const orgId = req.user?.orgId;
    const { id } = req.params;
    const payload = req.body;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    try {
        const doc = await templatesService_1.default.updateTemplate(orgId.toString(), id, payload, req.user?.id);
        if (!doc)
            return res.status(404).json({ message: 'Template not found' });
        return res.json(doc);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
async function deleteTemplate(req, res) {
    const orgId = req.user?.orgId;
    const { id } = req.params;
    if (!orgId)
        return res.status(400).json({ message: 'orgId missing' });
    try {
        const doc = await templatesService_1.default.deleteTemplate(orgId.toString(), id);
        if (!doc)
            return res.status(404).json({ message: 'Template not found' });
        return res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message || 'server error' });
    }
}
exports.default = {
    createTemplate,
    listTemplates,
    getTemplate,
    previewTemplate,
    updateTemplate,
    deleteTemplate,
};
