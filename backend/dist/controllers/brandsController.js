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
const Brand_1 = __importDefault(require("../models/Brand"));
async function create(req, res) {
    try {
        const orgId = req.user.orgId;
        const b = await Brand_1.default.create({ orgId, ...req.body });
        return res.status(201).json(b);
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function list(req, res) {
    try {
        const orgId = req.user.orgId;
        const docs = await Brand_1.default.find({ orgId }).sort({ name: 1 }).lean();
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
        const doc = await Brand_1.default.findOne({ _id: id, orgId }).lean();
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
        const doc = await Brand_1.default.findOneAndUpdate({ _id: id, orgId }, { $set: req.body }, { new: true }).lean();
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
        await Brand_1.default.findOneAndDelete({ _id: id, orgId });
        return res.status(204).send();
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
exports.default = { create, list, getOne, update, remove };
