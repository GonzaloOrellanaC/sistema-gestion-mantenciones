import WorkOrder, { WorkOrderState } from '../models/WorkOrder';
import { Types } from 'mongoose';
import countersService from './countersService';
import User from '../models/User';
import Branch from '../models/Branch';
import Asset from '../models/Asset';

interface CreateWorkOrderPayload {
  templateId?: string;
  data?: any;
  client?: any;
  assigneeId?: string; // optional explicit user assignment
  assigneeRole?: string; // optional role assignment (pick a user with this role)
  assetId?: string;
  scheduledStart?: string | Date; // optional scheduled start datetime (ISO string)
}

async function createWorkOrder(orgId: string, payload: CreateWorkOrderPayload, createdBy?: string) {
  // get next orgSeq
  const orgSeq = await countersService.getNextSequence(orgId);

  let assigneeId: Types.ObjectId | undefined = undefined;
  let initialState: WorkOrderState = 'Creado';
  const history: any[] = [{ userId: createdBy ? new Types.ObjectId(createdBy) : undefined, from: null, to: 'Creado', note: 'Creada', at: new Date() }];

  // assignment belongs to the work order creation request
  // Cannot accept both assigneeId and assigneeRole simultaneously
  if (payload.assigneeId && payload.assigneeRole) {
    throw { status: 400, message: 'Provide only one of assigneeId or assigneeRole' };
  }

  if (payload.assigneeId && Types.ObjectId.isValid(payload.assigneeId)) {
    // ensure user exists and belongs to org
    const user = await User.findOne({ _id: new Types.ObjectId(payload.assigneeId), orgId }).lean();
    if (user) {
      assigneeId = new Types.ObjectId(payload.assigneeId);
      initialState = 'Asignado';
      history.push({ userId: createdBy ? new Types.ObjectId(createdBy) : undefined, from: null, to: 'Asignado', note: 'Asignada al crear', at: new Date() });
    }
  } else if (payload.assigneeRole && Types.ObjectId.isValid(payload.assigneeRole)) {
    // find a user with that role in the same org (pick first available)
    const user = await User.findOne({ orgId, roleId: new Types.ObjectId(payload.assigneeRole) }).lean();
    if (user) {
      assigneeId = new Types.ObjectId((user as any)._id);
      initialState = 'Asignado';
      history.push({ userId: createdBy ? new Types.ObjectId(createdBy) : undefined, from: null, to: 'Asignado', note: 'Asignada al crear (role)', at: new Date() });
    }
  }

  // optional branch assignment
  let branchObjId: Types.ObjectId | undefined = undefined;
  if ((payload as any).branchId) {
    if (!Types.ObjectId.isValid((payload as any).branchId)) throw { status: 400, message: 'Invalid branchId' };
    const br = await Branch.findOne({ _id: (payload as any).branchId, orgId }).lean();
    if (!br) throw { status: 400, message: 'Branch not found' };
    branchObjId = new Types.ObjectId((payload as any).branchId);
  }

  // optional asset assignment
  let assetObjId: Types.ObjectId | undefined = undefined;
  if ((payload as any).assetId) {
    if (!Types.ObjectId.isValid((payload as any).assetId)) throw { status: 400, message: 'Invalid assetId' };
    const asset = await Asset.findOne({ _id: (payload as any).assetId, orgId }).lean();
    if (!asset) throw { status: 400, message: 'Asset not found' };
    assetObjId = new Types.ObjectId((payload as any).assetId);
  }

  const doc = new WorkOrder({
    orgId,
    orgSeq,
    branchId: branchObjId,
    assetId: assetObjId,
    templateId: payload.templateId ? new Types.ObjectId(payload.templateId) : undefined,
    data: payload.data || {},
    state: initialState,
    assigneeId: assigneeId,
    client: payload.client || {},
    dates: Object.assign({ created: new Date() }, payload.scheduledStart ? { start: new Date(payload.scheduledStart) } : {}),
    history
  });

  return doc.save();
}

async function findById(orgId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return WorkOrder.findOne({ _id: id, orgId }).populate('assigneeId').populate('templateId').populate('assetId').lean();
}

async function list(orgId: string, filter: any = {}) {
  const page = parseInt(filter.page, 10) || 1;
  const limit = parseInt(filter.limit, 10) || 10;
  const q: any = { orgId, deleted: { $ne: true } };
  if (filter.state) q.state = filter.state;
  if (filter.assigneeId) q.assigneeId = filter.assigneeId;
  if (filter.assetId) q.assetId = filter.assetId;
  if (filter.branchId) q.branchId = filter.branchId;
  console.log({q})
  const docs = await WorkOrder.find(q).sort({ 'dates.created': -1 }).skip((page - 1) * limit).limit(limit).lean();
  return docs;
}

async function addHistory(orgId: string, id: string, entry: any) {
  return WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $push: { history: entry } }, { new: true }).lean();
}

async function transition(orgId: string, id: string, toState: WorkOrderState, userId?: string, note?: string) {
  const now = new Date();

  // fetch current work order to validate transition
  const current: any = await WorkOrder.findOne({ _id: id, orgId }).lean();
  if (!current) throw { status: 404, message: 'WorkOrder not found' };

  // allowed transitions
  const allowed: Record<string, string[]> = {
    'Creado': ['Asignado'],
    'Asignado': ['Iniciado'],
    'Iniciado': ['En revisión'],
    'En revisión': ['Terminado', 'Asignado'],
    'Terminado': []
  };

  const fromState = current.state as WorkOrderState;
  if (!allowed[fromState] || !allowed[fromState].includes(toState)) {
    throw { status: 400, message: `Invalid state transition from ${fromState} to ${toState}` };
  }

  const update: any = { state: toState };
  if (toState === 'Iniciado') update['dates.start'] = now;
  if (toState === 'Terminado') update['dates.approvedAt'] = now;
  if (toState === 'En revisión') update['dates.end'] = now;

  const historyEntry = { userId: userId ? new Types.ObjectId(userId) : undefined, from: fromState, to: toState, note: note || '', at: now };

  const wo = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $set: update, $push: { history: historyEntry } }, { new: true }).lean();
  return wo;
}

async function assign(orgId: string, id: string, assigneeId: string, assignedBy?: string, note?: string) {
  const now = new Date();
  const update = {
    assigneeId: new Types.ObjectId(assigneeId),
    state: 'Asignado' as WorkOrderState,
    'dates.start': null
  } as any;

  const wo = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $set: update, $push: { history: { userId: assignedBy ? new Types.ObjectId(assignedBy) : undefined, from: null, to: 'Asignado', note: note || '', at: now } } }, { new: true }).lean();
  return wo;
}

async function patchData(orgId: string, id: string, data: any, userId?: string) {
  const now = new Date();
  const wo = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $set: { data, 'dates.end': now }, $push: { history: { userId: userId ? new Types.ObjectId(userId) : undefined, from: null, to: 'Iniciado', note: 'Datos actualizados', at: now } } }, { new: true }).lean();
  return wo;
}

async function remove(orgId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return WorkOrder.findOneAndDelete({ _id: id, orgId });
}

export default {
  createWorkOrder,
  findById,
  list,
  addHistory,
  transition,
  assign,
  patchData,
  remove
};
