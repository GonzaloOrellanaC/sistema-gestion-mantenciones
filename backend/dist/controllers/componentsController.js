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
const Component_1 = __importDefault(require("../models/Component"));
const Branch_1 = __importDefault(require("../models/Branch"));
const Asset_1 = __importDefault(require("../models/Asset"));
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
async function create(req, res) {
    try {
        const orgId = req.user.orgId;
        const { branchId, assetId, workOrderId } = req.body;
        if (branchId) {
            const b = await Branch_1.default.findOne({ _id: branchId, orgId }).lean();
            if (!b)
                return res.status(400).json({ message: 'Branch not found' });
        }
        if (assetId) {
            const a = await Asset_1.default.findOne({ _id: assetId, orgId }).lean();
            if (!a)
                return res.status(400).json({ message: 'Asset not found' });
        }
        if (workOrderId) {
            const w = await WorkOrder_1.default.findOne({ _id: workOrderId, orgId }).lean();
            if (!w)
                return res.status(400).json({ message: 'Work order not found' });
        }
        const data = { orgId, ...req.body };
        const doc = await Component_1.default.create(data);
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
        if (req.query.assetId)
            q.assetId = String(req.query.assetId);
        if (req.query.available === 'true')
            q.dateInUse = { $exists: false };
        const items = await Component_1.default.find(q).populate('branchId').populate('assetId').populate('workOrderId').lean();
        return res.json({ items });
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
        const doc = await Component_1.default.findOne({ _id: id, orgId }).populate('branchId').populate('assetId').populate('workOrderId').lean();
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
        const doc = await Component_1.default.findOneAndUpdate({ _id: id, orgId }, { $set: req.body }, { new: true }).lean();
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
        await Component_1.default.findOneAndDelete({ _id: id, orgId });
        return res.status(204).send();
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
exports.default = { create, list, getOne, update, remove };
