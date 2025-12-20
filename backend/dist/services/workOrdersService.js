"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WorkOrder_1 = __importDefault(require("../models/WorkOrder"));
const mongoose_1 = require("mongoose");
const countersService_1 = __importDefault(require("./countersService"));
const User_1 = __importDefault(require("../models/User"));
const Branch_1 = __importDefault(require("../models/Branch"));
async function createWorkOrder(orgId, payload, createdBy) {
    // get next orgSeq
    const orgSeq = await countersService_1.default.getNextSequence(orgId);
    let assigneeId = undefined;
    let initialState = 'Creado';
    const history = [{ userId: createdBy ? new mongoose_1.Types.ObjectId(createdBy) : undefined, from: null, to: 'Creado', note: 'Creada', at: new Date() }];
    // assignment belongs to the work order creation request
    // Cannot accept both assigneeId and assigneeRole simultaneously
    if (payload.assigneeId && payload.assigneeRole) {
        throw { status: 400, message: 'Provide only one of assigneeId or assigneeRole' };
    }
    if (payload.assigneeId && mongoose_1.Types.ObjectId.isValid(payload.assigneeId)) {
        // ensure user exists and belongs to org
        const user = await User_1.default.findOne({ _id: new mongoose_1.Types.ObjectId(payload.assigneeId), orgId }).lean();
        if (user) {
            assigneeId = new mongoose_1.Types.ObjectId(payload.assigneeId);
            initialState = 'Asignado';
            history.push({ userId: createdBy ? new mongoose_1.Types.ObjectId(createdBy) : undefined, from: null, to: 'Asignado', note: 'Asignada al crear', at: new Date() });
        }
    }
    else if (payload.assigneeRole && mongoose_1.Types.ObjectId.isValid(payload.assigneeRole)) {
        // find a user with that role in the same org (pick first available)
        const user = await User_1.default.findOne({ orgId, roleId: new mongoose_1.Types.ObjectId(payload.assigneeRole) }).lean();
        if (user) {
            assigneeId = new mongoose_1.Types.ObjectId(user._id);
            initialState = 'Asignado';
            history.push({ userId: createdBy ? new mongoose_1.Types.ObjectId(createdBy) : undefined, from: null, to: 'Asignado', note: 'Asignada al crear (role)', at: new Date() });
        }
    }
    // optional branch assignment
    let branchObjId = undefined;
    if (payload.branchId) {
        if (!mongoose_1.Types.ObjectId.isValid(payload.branchId))
            throw { status: 400, message: 'Invalid branchId' };
        const br = await Branch_1.default.findOne({ _id: payload.branchId, orgId }).lean();
        if (!br)
            throw { status: 400, message: 'Branch not found' };
        branchObjId = new mongoose_1.Types.ObjectId(payload.branchId);
    }
    const doc = new WorkOrder_1.default({
        orgId,
        orgSeq,
        branchId: branchObjId,
        templateId: payload.templateId ? new mongoose_1.Types.ObjectId(payload.templateId) : undefined,
        data: payload.data || {},
        state: initialState,
        assigneeId: assigneeId,
        client: payload.client || {},
        dates: Object.assign({ created: new Date() }, payload.scheduledStart ? { start: new Date(payload.scheduledStart) } : {}),
        history
    });
    return doc.save();
}
async function findById(orgId, id) {
    if (!mongoose_1.Types.ObjectId.isValid(id))
        return null;
    return WorkOrder_1.default.findOne({ _id: id, orgId }).populate('assigneeId').populate('templateId').lean();
}
async function list(orgId, filter = {}) {
    const page = parseInt(filter.page, 10) || 1;
    const limit = parseInt(filter.limit, 10) || 10;
    const q = { orgId, deleted: { $ne: true } };
    if (filter.state)
        q.state = filter.state;
    if (filter.assigneeId)
        q.assigneeId = filter.assigneeId;
    if (filter.branchId)
        q.branchId = filter.branchId;
    console.log({ q });
    const docs = await WorkOrder_1.default.find(q).sort({ 'dates.created': -1 }).skip((page - 1) * limit).limit(limit).lean();
    return docs;
}
async function addHistory(orgId, id, entry) {
    return WorkOrder_1.default.findOneAndUpdate({ _id: id, orgId }, { $push: { history: entry } }, { new: true }).lean();
}
async function transition(orgId, id, toState, userId, note) {
    const now = new Date();
    // fetch current work order to validate transition
    const current = await WorkOrder_1.default.findOne({ _id: id, orgId }).lean();
    if (!current)
        throw { status: 404, message: 'WorkOrder not found' };
    // allowed transitions
    const allowed = {
        'Creado': ['Asignado'],
        'Asignado': ['Iniciado'],
        'Iniciado': ['En revisión'],
        'En revisión': ['Terminado', 'Asignado'],
        'Terminado': []
    };
    const fromState = current.state;
    if (!allowed[fromState] || !allowed[fromState].includes(toState)) {
        throw { status: 400, message: `Invalid state transition from ${fromState} to ${toState}` };
    }
    const update = { state: toState };
    if (toState === 'Iniciado')
        update['dates.start'] = now;
    if (toState === 'Terminado')
        update['dates.approvedAt'] = now;
    if (toState === 'En revisión')
        update['dates.end'] = now;
    const historyEntry = { userId: userId ? new mongoose_1.Types.ObjectId(userId) : undefined, from: fromState, to: toState, note: note || '', at: now };
    const wo = await WorkOrder_1.default.findOneAndUpdate({ _id: id, orgId }, { $set: update, $push: { history: historyEntry } }, { new: true }).lean();
    return wo;
}
async function assign(orgId, id, assigneeId, assignedBy, note) {
    const now = new Date();
    const update = {
        assigneeId: new mongoose_1.Types.ObjectId(assigneeId),
        state: 'Asignado',
        'dates.start': null
    };
    const wo = await WorkOrder_1.default.findOneAndUpdate({ _id: id, orgId }, { $set: update, $push: { history: { userId: assignedBy ? new mongoose_1.Types.ObjectId(assignedBy) : undefined, from: null, to: 'Asignado', note: note || '', at: now } } }, { new: true }).lean();
    return wo;
}
async function patchData(orgId, id, data, userId) {
    const now = new Date();
    const wo = await WorkOrder_1.default.findOneAndUpdate({ _id: id, orgId }, { $set: { data, 'dates.end': now }, $push: { history: { userId: userId ? new mongoose_1.Types.ObjectId(userId) : undefined, from: null, to: 'Iniciado', note: 'Datos actualizados', at: now } } }, { new: true }).lean();
    return wo;
}
async function remove(orgId, id) {
    if (!mongoose_1.Types.ObjectId.isValid(id))
        return null;
    return WorkOrder_1.default.findOneAndDelete({ _id: id, orgId });
}
exports.default = {
    createWorkOrder,
    findById,
    list,
    addHistory,
    transition,
    assign,
    patchData,
    remove
};
