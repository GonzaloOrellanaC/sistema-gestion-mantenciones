"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = create;
exports.bulkCreate = bulkCreate;
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
async function bulkCreate(req, res) {
    try {
        const orgId = req.user.orgId;
        const payload = req.body;
        if (!Array.isArray(payload))
            return res.status(400).json({ message: 'Payload must be an array' });
        // Helper para buscar o crear
        async function findOrCreate(model, query, createFields) {
            let doc = await model.findOne(query).lean();
            if (!doc) {
                doc = await model.create({ ...createFields, ...query, orgId });
                doc = doc.toObject ? doc.toObject() : doc;
            }
            return doc;
        }
        // Buscar branches existentes
        const branches = await Branch_1.default.find({ orgId }).lean();
        const branchMap = branches.reduce((acc, b) => {
            acc[b.name] = b;
            return acc;
        }, {});
        const docsToInsert = [];
        for (const it of payload) {
            const doc = { orgId };
            // code -> serial
            if (it.code)
                doc.serial = it.code;
            // name
            if (it.name)
                doc.name = it.name;
            // branchId
            if (it.branch && branchMap[it.branch]) {
                doc.branchId = branchMap[it.branch]._id;
            }
            // brandId
            if (it.brand) {
                const brand = await findOrCreate(Brand_1.default, { name: it.brand, orgId }, { name: it.brand });
                doc.brandId = brand._id;
            }
            // typeId
            if (it.type) {
                const type = await findOrCreate(AssetType_1.default, { name: it.type, orgId }, { name: it.type });
                doc.typeId = type._id;
            }
            // modelId
            if (it.model) {
                const model = await findOrCreate(DeviceModel_1.default, { name: it.model, orgId, brandId: doc.brandId, typeId: doc.typeId }, { name: it.model });
                doc.modelId = model._id;
            }
            // Otros campos
            for (const k of Object.keys(it)) {
                if (!["code", "name", "branch", "brand", "model", "type"].includes(k)) {
                    doc[k] = it[k];
                }
            }
            docsToInsert.push(doc);
        }
        const created = await Asset_1.default.insertMany(docsToInsert, { ordered: false });
        return res.status(201).json({ created });
    }
    catch (err) {
        console.error(err);
        if (err && err.insertedDocs)
            return res.status(201).json({ created: err.insertedDocs, error: err.message });
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function list(req, res) {
    try {
        const orgId = req.user.orgId;
        const q = { orgId };
        if (req.query.branchId)
            q.branchId = String(req.query.branchId);
        if (req.query.name)
            q.name = { $regex: String(req.query.name), $options: 'i' };
        if (req.query.serial)
            q.serial = { $regex: String(req.query.serial), $options: 'i' };
        if (req.query.brandId)
            q.brandId = String(req.query.brandId);
        if (req.query.modelId)
            q.modelId = String(req.query.modelId);
        if (req.query.typeId)
            q.typeId = String(req.query.typeId);
        // support filtering by created date (YYYY-MM-DD)
        if (req.query.createdDate) {
            const val = String(req.query.createdDate);
            // expect YYYY-MM-DD; parse as local date to avoid timezone shifts
            const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (isoMatch) {
                const y = Number(isoMatch[1]);
                const m = Number(isoMatch[2]);
                const d = Number(isoMatch[3]);
                if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
                    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
                    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
                    q.createdAt = { $gte: start, $lte: end };
                }
            }
            else {
                const parsed = new Date(val);
                if (!isNaN(parsed.getTime())) {
                    const start = new Date(parsed);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(parsed);
                    end.setHours(23, 59, 59, 999);
                    q.createdAt = { $gte: start, $lte: end };
                }
            }
        }
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        const total = await Asset_1.default.countDocuments(q);
        const items = await Asset_1.default.find(q)
            .populate('brandId')
            .populate('modelId')
            .populate('typeId')
            .populate('branchId')
            .skip(skip)
            .limit(limit)
            .lean();
        const pages = Math.max(1, Math.ceil(total / limit));
        return res.json({ items, total, page, pages });
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
        // avoid casting non-object ids (like 'bulk-upload') to ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid id' });
        }
        const doc = await Asset_1.default.findOne({ _id: id, orgId })
            .populate('brandId')
            .populate('modelId')
            .populate('typeId')
            .populate('branchId')
            .lean();
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
exports.default = { create, list, bulkCreate, getOne, update, remove };
