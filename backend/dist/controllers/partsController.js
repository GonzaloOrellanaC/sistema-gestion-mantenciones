"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreate = bulkCreate;
exports.create = create;
exports.list = list;
exports.availability = availability;
exports.getOne = getOne;
exports.update = update;
exports.remove = remove;
exports.usageHistory = usageHistory;
const Part_1 = __importDefault(require("../models/Part"));
const FileMeta_1 = __importDefault(require("../models/FileMeta"));
const fs_1 = __importDefault(require("fs"));
const Lot_1 = __importDefault(require("../models/Lot"));
const Branch_1 = __importDefault(require("../models/Branch"));
const Asset_1 = __importDefault(require("../models/Asset"));
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
const PartInventory_1 = __importDefault(require("../models/PartInventory"));
const mongoose_1 = __importDefault(require("mongoose"));
const partsUtils_1 = require("../utils/partsUtils");
async function bulkCreate(req, res) {
    try {
        const orgId = req.user.orgId;
        const payload = req.body;
        if (!Array.isArray(payload))
            return res.status(400).json({ message: 'Payload must be an array' });
        // Buscar branches existentes
        const branches = await Branch_1.default.find({ orgId }).lean();
        const branchMap = branches.reduce((acc, b) => {
            acc[b.name] = b;
            return acc;
        }, {});
        console.log('branchMap', branchMap);
        // Buscar assets existentes
        const assets = await Asset_1.default.find({ orgId }).lean();
        const assetMap = assets.reduce((acc, a) => {
            acc[a.name] = a;
            return acc;
        }, {});
        console.log('assetMap', assetMap);
        const createdParts = [];
        let index = 0;
        for (const it of payload) {
            const doc = { orgId };
            // name
            if (it.name)
                doc.name = it.name;
            // branchIds
            let branchId = null;
            if (it.branch && branchMap[it.branch]) {
                branchId = branchMap[it.branch]._id;
                doc.branchIds = branchId;
            }
            // assetIds (array)
            if (it.assets) {
                const assetNames = String(it.assets).split(',').map(s => s.trim()).filter(Boolean);
                doc.assetIds = assetNames.map(n => assetMap[n]?._id).filter(Boolean);
                if (index === 0)
                    console.log('mapping assets', it.assets, 'to ids', doc.assetIds);
            }
            // sku -> serial
            if (it.sku)
                doc.serial = it.sku;
            // Otros campos
            for (const k of Object.keys(it)) {
                if (!["name", "branch", "assets"].includes(k)) {
                    doc[k] = it[k];
                }
            }
            // Crear lote
            const randomCode = Math.random().toString(36).substring(2, 12);
            const lot = await Lot_1.default.create({
                orgId,
                branchId,
                code: randomCode,
                items: [{ itemId: null, quantity: 0 }],
                meta: { createdByBulk: true },
                createdAt: new Date()
            });
            // Insertar parte
            const part = await Part_1.default.create(doc);
            // Actualizar lote con el itemId
            await Lot_1.default.findByIdAndUpdate(lot._id, { $set: { 'items.0.itemId': part._id } });
            // Crear PartInventory
            const qty = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 0;
            await PartInventory_1.default.create({
                orgId,
                itemId: part._id,
                lotId: lot._id,
                initialQuantity: qty,
                remainingQuantity: qty,
                createdAt: new Date()
            });
            createdParts.push(part);
            index++;
        }
        return res.status(201).json({ created: createdParts });
    }
    catch (err) {
        console.error(err);
        const e = err;
        if (e && e.insertedDocs)
            return res.status(201).json({ created: e.insertedDocs, error: e.message });
        return res.status(e.status || 500).json({ message: e.message || 'Server error' });
    }
}
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
        // normalize types from form submissions
        if (typeof data.price === 'string')
            data.price = Number(data.price) || 0;
        // If a lot code/id is provided as string, leave casting to mongoose (will cast to ObjectId if appropriate)
        const doc = await Part_1.default.create(data);
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
            q.branchIds = new mongoose_1.default.Types.ObjectId(String(req.query.branchId));
        // support assetId or assetIds (comma separated)
        if (req.query.assetId)
            q.assetIds = new mongoose_1.default.Types.ObjectId(String(req.query.assetId));
        if (req.query.assetIds) {
            const raw = String(req.query.assetIds || '');
            const ids = raw.split(',').map(s => s.trim()).filter(Boolean).map(s => new mongoose_1.default.Types.ObjectId(s));
            if (ids.length)
                q.assetIds = { $in: ids };
        }
        const lowOnly = (req.query.lowStock === '1' || String(req.query.lowStock) === 'true');
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 10);
        const skip = (page - 1) * limit;
        // If lowStock filter requested, precompute which part ids are low and restrict query
        if (lowOnly) {
            const allParts = await Part_1.default.find(q).select('_id minStock').lean();
            const ids = allParts.map((p) => p._id);
            const aggMatchOrgId = new mongoose_1.default.Types.ObjectId(String(orgId));
            const aggItemIds = ids.map((x) => new mongoose_1.default.Types.ObjectId(String(x)));
            const invAgg = await PartInventory_1.default.aggregate([
                { $match: { orgId: aggMatchOrgId, itemId: { $in: aggItemIds } } },
                { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' } } }
            ]);
            const remainingMap = {};
            invAgg.forEach((a) => { remainingMap[String(a._id)] = a.remaining || 0; });
            const lowIds = allParts.filter((p) => {
                const rem = remainingMap[String(p._id)] || 0;
                const min = Number(p.minStock || 0);
                return rem <= min;
            }).map((p) => p._id);
            if (lowIds.length === 0)
                return res.json({ items: [], total: 0, page: 1, pages: 1 });
            q._id = { $in: lowIds };
        }
        const total = await Part_1.default.countDocuments(q);
        const items = await Part_1.default.find(q).populate('docs').populate({ path: 'branchIds', select: 'name' }).populate({ path: 'assetIds', select: 'name' }).skip(skip).limit(limit).lean();
        // attach inventory totals (remaining and initial) for returned parts
        const ids = items.map((p) => p._id);
        const aggMatchOrgId2 = new mongoose_1.default.Types.ObjectId(String(orgId));
        const aggItemIds2 = ids.map((x) => new mongoose_1.default.Types.ObjectId(String(x)));
        const invAgg = ids.length > 0 ? await PartInventory_1.default.aggregate([
            { $match: { orgId: aggMatchOrgId2, itemId: { $in: aggItemIds2 } } },
            { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' }, initial: { $sum: '$initialQuantity' } } }
        ]) : [];
        const invMap = {};
        invAgg.forEach((a) => { invMap[String(a._id)] = a; });
        // fetch inventories per item (detailed) and group by itemId
        const invDetails = ids.length ? await PartInventory_1.default.find({ orgId: aggMatchOrgId2, itemId: { $in: aggItemIds2 } }).populate({ path: 'lotId', select: 'code purchaseDate price supplier' }).lean() : [];
        const invByItem = {};
        invDetails.forEach((it) => {
            const key = String(it.itemId);
            if (!invByItem[key])
                invByItem[key] = [];
            invByItem[key].push(it);
        });
        const mapped = items.map((p) => {
            const idStr = String(p._id);
            const totalRemaining = invMap[idStr] ? invMap[idStr].remaining : 0;
            const min = Number(p.minStock || 0);
            let stockStatus = 'unknown';
            if (totalRemaining <= 0)
                stockStatus = 'out';
            else if (min > 0 && totalRemaining <= min)
                stockStatus = 'low';
            else
                stockStatus = 'ok';
            const invs = invByItem[idStr] || [];
            return {
                ...p,
                quantity: totalRemaining,
                initialQuantity: invMap[idStr] ? invMap[idStr].initial : 0,
                inventories: invs,
                stockStatus
            };
        });
        const pages = Math.max(1, Math.ceil(total / limit));
        return res.json({ items: mapped, total, page, pages });
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function availability(req, res) {
    try {
        const orgId = req.user.orgId;
        const { partIds } = req.body || {};
        if (!Array.isArray(partIds) || partIds.length === 0) {
            return res.json({ items: [] });
        }
        // find parts in one query
        // sum remainingQuantity from PartInventory for requested parts
        const aggOrgId = new mongoose_1.default.Types.ObjectId(String(orgId));
        const aggIds = partIds.map((p) => new mongoose_1.default.Types.ObjectId(String(p)));
        const agg = await PartInventory_1.default.aggregate([
            { $match: { orgId: aggOrgId, itemId: { $in: aggIds } } },
            { $group: { _id: '$itemId', remaining: { $sum: '$remainingQuantity' }, initial: { $sum: '$initialQuantity' } } }
        ]);
        const remMap = {};
        const initMap = {};
        agg.forEach((a) => { remMap[String(a._id)] = a.remaining || 0; initMap[String(a._id)] = a.initial || 0; });
        const parts = await Part_1.default.find({ orgId, _id: { $in: partIds } }).lean();
        const byId = {};
        parts.forEach((p) => { byId[String(p._id)] = p; });
        const items = partIds.map((id) => {
            const idStr = String(id);
            return { partId: id, available: remMap[idStr] || 0, initial: initMap[idStr] || 0, part: byId[idStr] || null };
        });
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
        const doc = await Part_1.default.findOne({ _id: id, orgId }).populate('docs').lean();
        if (!doc)
            return res.status(404).json({ message: 'Not found' });
        // attach inventory entries for this part
        const inv = await PartInventory_1.default.find({ orgId: new mongoose_1.default.Types.ObjectId(String(orgId)), itemId: new mongoose_1.default.Types.ObjectId(String(id)) }).populate({ path: 'lotId', select: 'code purchaseDate price supplier' }).lean();
        const totalRemaining = inv.reduce((s, x) => s + (Number(x.remainingQuantity || 0)), 0);
        return res.json({ ...doc, inventories: inv, quantity: totalRemaining });
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
        const data = { ...req.body };
        if (typeof data.price === 'string')
            data.price = Number(data.price) || 0;
        // handle docsToRemove: delete file from storage (if local) and remove FileMeta records
        const docsToRemove = Array.isArray(data.docsToRemove) ? data.docsToRemove.map(String) : [];
        if (docsToRemove.length > 0) {
            try {
                const metas = await FileMeta_1.default.find({ _id: { $in: docsToRemove }, orgId }).lean();
                for (const m of metas) {
                    try {
                        if (m.storage === 'local' && m.path) {
                            fs_1.default.unlinkSync(String(m.path));
                        }
                    }
                    catch (e) {
                        console.warn('failed removing file from disk', m.path, e);
                    }
                }
                await FileMeta_1.default.deleteMany({ _id: { $in: docsToRemove }, orgId });
                // ensure part doc references are removed
                await Part_1.default.findOneAndUpdate({ _id: id, orgId }, { $pull: { docs: { $in: docsToRemove } } });
            }
            catch (e) {
                console.warn('error processing docsToRemove', e);
            }
            // remove flag from incoming data so we don't try to set it
            delete data.docsToRemove;
        }
        const doc = await Part_1.default.findOneAndUpdate({ _id: id, orgId }, { $set: data }, { new: true }).lean();
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
        await Part_1.default.findOneAndDelete({ _id: id, orgId });
        return res.status(204).send();
    }
    catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
async function usageHistory(req, res) {
    try {
        const orgId = req.user.orgId;
        const { id } = req.params; // part id to analyze
        console.log('usageHistory for part', id, 'org', orgId);
        const from = req.query.from ? new Date(String(req.query.from)) : null;
        const to = req.query.to ? new Date(String(req.query.to)) : null;
        const q = { orgId: new mongoose_1.default.Types.ObjectId(String(orgId)) };
        // only work orders that have an assignedAt date
        q['dates.assignedAt'] = { $exists: true };
        if (from || to) {
            q['dates.assignedAt'] = {};
            if (from)
                q['dates.assignedAt'].$gte = from;
            if (to)
                q['dates.assignedAt'].$lte = to;
        }
        // fetch orders and populate template structure
        const orders = await WorkOrder_1.default.find(q).populate({ path: 'templateId', select: 'structure' }).lean();
        // analyze each order to extract parts from template structure
        const analysis = (0, partsUtils_1.analyzeWorkOrdersParts)(orders);
        const events = [];
        orders.forEach((w) => {
            const wid = String(w._id || w.id || '');
            const a = analysis[wid];
            if (!a || !Array.isArray(a.parts) || a.parts.length === 0)
                return;
            a.parts.forEach((p) => {
                // normalize id checks: part may be referenced by _id, id, partId or embedded object
                const pidCandidates = [p && (p._id || p.id || p.partId), p && p.part && (p.part._id || p.part.id), String(p && (p._id || p.id || p.partId || ''))];
                const match = pidCandidates.some((c) => { if (!c)
                    return false; return String(c) === String(id); });
                if (!match)
                    return;
                // attempt to get quantity from common fields
                const qty = Number(p.quantity || p.qty || p.count || p.amount || p.cantidad || 1) || 1;
                events.push({ workOrderId: wid, assignedAt: w.dates && w.dates.assignedAt ? w.dates.assignedAt : null, quantity: qty });
            });
        });
        // sort events by assignedAt ascending
        events.sort((a, b) => {
            const da = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
            const db = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
            return da - db;
        });
        // Fetch PartInventory docs for this part to compute original totals by date
        // PartInventory may reference a Lot with purchaseDate; prefer lot.purchaseDate, fallback to inventory.createdAt
        const invDocs = await PartInventory_1.default.find({ orgId: new mongoose_1.default.Types.ObjectId(String(orgId)), itemId: new mongoose_1.default.Types.ObjectId(String(id)) }).populate({ path: 'lotId', select: 'purchaseDate' }).lean();
        // Compute overall originalTotal (sum of initialQuantity) up to `to` if provided, else include all
        const cutoff = to ? new Date(String(to)) : null;
        let overallOriginalTotal = 0;
        invDocs.forEach((inv) => {
            const invCreated = inv && inv.createdAt ? new Date(inv.createdAt) : null;
            const lotPurchase = inv && inv.lotId && inv.lotId.purchaseDate ? new Date(inv.lotId.purchaseDate) : null;
            const effectiveDate = lotPurchase || invCreated;
            if (!cutoff || (effectiveDate && effectiveDate.getTime() <= cutoff.getTime())) {
                overallOriginalTotal += Number(inv.initialQuantity || 0);
            }
        });
        // fetch part basic info (for meta)
        const partDoc = await Part_1.default.findOne({ _id: id, orgId: new mongoose_1.default.Types.ObjectId(String(orgId)) }).lean();
        // Build items with only requested fields and min threshold
        const items = events.map((ev) => ({
            workOrderId: ev.workOrderId,
            assignedAt: ev.assignedAt,
            quantity: ev.quantity,
            min: partDoc ? Number(partDoc.minStock || 0) : null
        }));
        const meta = {
            part: partDoc ? { _id: partDoc._id, name: partDoc.name, serial: partDoc.serial, minStock: partDoc.minStock } : null
        };
        // Build acquisitions list grouped by lot with purchaseDate and originalTotal per lot
        const acquisitionsMap = {};
        invDocs.forEach((inv) => {
            const lot = inv && inv.lotId ? inv.lotId : null;
            const lotId = lot && (lot._id || lot) ? String(lot._id || lot) : String(inv._id || 'unknown');
            const lotPurchase = lot && lot.purchaseDate ? new Date(lot.purchaseDate) : null;
            const invCreated = inv && inv.createdAt ? new Date(inv.createdAt) : null;
            const effectiveDate = lotPurchase || invCreated;
            // apply same cutoff logic used for overallOriginalTotal
            if (cutoff && effectiveDate && effectiveDate.getTime() > cutoff.getTime())
                return;
            if (!acquisitionsMap[lotId])
                acquisitionsMap[lotId] = { lotId, purchaseDate: lotPurchase || invCreated || null, originalTotal: 0 };
            acquisitionsMap[lotId].originalTotal += Number(inv.initialQuantity || 0);
        });
        const acquisitions = Object.values(acquisitionsMap);
        meta['acquisitions'] = acquisitions;
        return res.json({ items, meta });
    }
    catch (err) {
        console.error('usageHistory error', err);
        return res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
}
exports.default = { bulkCreate, create, list, availability, getOne, update, remove, usageHistory };
