"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.list = list;
exports.getOne = getOne;
exports.update = update;
exports.remove = remove;
const Asset_1 = __importDefault(require("../models/Asset"));
const DeviceModel_1 = __importDefault(require("../models/DeviceModel"));
const Brand_1 = __importDefault(require("../models/Brand"));
const AssetType_1 = __importDefault(require("../models/AssetType"));
const Branch_1 = __importDefault(require("../models/Branch"));
async function create(req, res) {
    try {
        const orgId = req.user.orgId;
        const { modelId, brandId, typeId, docs } = req.body;
        // validate model, brand, and type if provided
        if (modelId) {
            const m = await DeviceModel_1.default.findOne({ _id: modelId, orgId }).lean();
            if (!m)
                return res.status(400).json({ message: 'Model not found' });
        }
        if (brandId) {
            const b = await Brand_1.default.findOne({ _id: brandId, orgId }).lean();
            if (!b)
                return res.status(400).json({ message: 'Brand not found' });
        }
        if (typeId) {
            const t = await AssetType_1.default.findOne({ _id: typeId, orgId }).lean();
            if (!t)
                return res.status(400).json({ message: 'Type not found' });
        }
        if (req.body.branchId) {
            const b = await Branch_1.default.findOne({ _id: req.body.branchId, orgId }).lean();
            if (!b)
                return res.status(400).json({ message: 'Branch not found' });
        }
        const data = { orgId, ...req.body };
        // ensure docs is array of ids
        if (docs && !Array.isArray(docs))
            data.docs = [docs];
        const doc = await Asset_1.default.create(data);
        return res.status(201).json(doc);
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function list(req, res) {
    try {
        const orgId = req.user.orgId;
        const q = { orgId };
        if (req.query.branchId)
            q.branchId = String(req.query.branchId);
        const docs = await Asset_1.default.find(q).populate('brandId').populate('modelId').populate('typeId').lean();
        return res.json({ items: docs });
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function getOne(req, res) {
    try {
        const orgId = req.user.orgId;
        const { id } = req.params;
        const doc = await Asset_1.default.findOne({ _id: id, orgId }).populate('brandId').populate('modelId').populate('typeId').lean();
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        return res.json(doc);
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function update(req, res) {
    try {
        const orgId = req.user.orgId;
        const { id } = req.params;
        const doc = await Asset_1.default.findOneAndUpdate({ _id: id, orgId }, { $set: req.body }, { new: true }).lean();
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        return res.json(doc);
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function remove(req, res) {
    try {
        const orgId = req.user.orgId;
        const { id } = req.params;
        await Asset_1.default.findOneAndDelete({ _id: id, orgId });
        return res.status(204).send();
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
exports.default = { create, list, getOne, update, remove };
