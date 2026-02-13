import WorkOrder, { WorkOrderState } from '../models/WorkOrder';
import { WORK_ORDER_STATES } from '../utils/workOrderStates';
import { Types } from 'mongoose';
import countersService from './countersService';
import User from '../models/User';
import notificationsService from './notificationsService';
import Branch from '../models/Branch';
import Asset from '../models/Asset';
import Template from '../models/Template';
import { analyzeWorkOrdersParts } from '../utils/partsUtils';

interface CreateWorkOrderPayload {
  templateId?: string;
  data?: any;
  client?: any;
  assigneeId?: string; // optional explicit user assignment
  assigneeRole?: string; // optional role assignment (pick a user with this role)
  assetId: string;
  scheduledStart?: string | Date; // optional scheduled start datetime (ISO string)
  urgency?: 'Baja'|'Media'|'Alta';
  expectedEnd?: string | Date; // optional expected end datetime (ISO string)
  expectedDurationDays?: number; // optional expected duration in days
}

async function createWorkOrder(orgId: string, payload: CreateWorkOrderPayload, createdBy?: string) {
  // get next orgSeq
  const orgSeq = await countersService.getNextSequence(orgId);

  let assigneeId: Types.ObjectId | undefined = undefined;
  let initialState: WorkOrderState = WORK_ORDER_STATES.CREATED as WorkOrderState;
  const history: any[] = [{ userId: createdBy ? new Types.ObjectId(createdBy) : undefined, from: null, to: WORK_ORDER_STATES.CREATED, note: 'Created', at: new Date() }];

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
      initialState = WORK_ORDER_STATES.ASSIGNED as WorkOrderState;
      history.push({ userId: createdBy ? new Types.ObjectId(createdBy) : undefined, from: null, to: WORK_ORDER_STATES.ASSIGNED, note: 'Assigned on create', at: new Date() });
    }
  } else if (payload.assigneeRole && Types.ObjectId.isValid(payload.assigneeRole)) {
    // find a user with that role in the same org (pick first available)
    const user = await User.findOne({ orgId, roleId: new Types.ObjectId(payload.assigneeRole) }).lean();
    if (user) {
      assigneeId = new Types.ObjectId((user as any)._id);
      initialState = WORK_ORDER_STATES.ASSIGNED as WorkOrderState;
      history.push({ userId: createdBy ? new Types.ObjectId(createdBy) : undefined, from: null, to: WORK_ORDER_STATES.ASSIGNED, note: 'Assigned on create (role)', at: new Date() });
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

  // require asset assignment
  if (!payload.assetId) throw { status: 400, message: 'assetId is required' };
  if (!Types.ObjectId.isValid(payload.assetId)) throw { status: 400, message: 'Invalid assetId' };
  const asset = await Asset.findOne({ _id: payload.assetId, orgId }).lean();
  if (!asset) throw { status: 400, message: 'Asset not found' };
  const assetObjId = new Types.ObjectId(payload.assetId);

  // compute dates: created, scheduled start and estimated end using template defaults
  const createdDate = new Date();
  let scheduledStart: Date | undefined = undefined;
  let estimatedEnd: Date | undefined = undefined;
  let templateObj: any = null;
  if (payload.templateId && Types.ObjectId.isValid(payload.templateId)) {
    templateObj = await Template.findOne({ _id: payload.templateId, orgId }).lean();
  }
  if (payload.scheduledStart) {
    scheduledStart = new Date(payload.scheduledStart);
  } else if (templateObj) {
    const minDays = typeof templateObj.execWindowMinDays === 'number' ? templateObj.execWindowMinDays : 0;
    scheduledStart = new Date(createdDate.getTime() + minDays * 24 * 60 * 60 * 1000);
  }
  if (scheduledStart) {
    const durDays = (templateObj && typeof templateObj.expectedDurationDays === 'number') ? templateObj.expectedDurationDays : (payload.expectedDurationDays ? Number(payload.expectedDurationDays) : 1);
    estimatedEnd = new Date(scheduledStart.getTime() + durDays * 24 * 60 * 60 * 1000);
  }

  const datesObj: any = { created: createdDate };
  if (scheduledStart) datesObj.start = scheduledStart;
  if (estimatedEnd) datesObj.estimatedEnd = estimatedEnd;
  if (initialState === WORK_ORDER_STATES.ASSIGNED) datesObj.assignedAt = new Date();

  const doc = new WorkOrder({
    orgId,
    orgSeq,
    branchId: branchObjId,
    assetId: assetObjId,
    templateId: payload.templateId ? new Types.ObjectId(payload.templateId) : undefined,
    data: payload.data || {},
    state: initialState,
    urgency: (payload as any).urgency || 'Media',
    assigneeId: assigneeId,
    client: payload.client || {},
    dates: datesObj,
    history
  });

  const saved = await doc.save();
  return findById(orgId, saved._id.toString());
}

async function findById(orgId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return WorkOrder.findOne({ _id: id, orgId })
    .populate('assigneeId')
    .populate('templateId')
    .populate('assetId')
    .populate('branchId')
    .lean();
}

async function list(orgId: string, filter: any = {}) {
  const page = Math.max(1, parseInt(filter.page, 10) || 1);
  const limit = Math.min(100, parseInt(filter.limit, 10) || 10);
  const q: any = { orgId, deleted: { $ne: true } };
  // explicit include by state
  if (filter.state) q.state = filter.state;
  // allow excluding one or more states using `excludeState` or `excludeStates` query param
  // supports comma-separated string or array values
  const rawExclude = filter.excludeStates || filter.excludeState;
  if (rawExclude) {
    let excl: string[] = [];
    if (Array.isArray(rawExclude)) excl = rawExclude.map((s: any) => String(s));
    else if (typeof rawExclude === 'string') excl = rawExclude.split(',').map((s) => s.trim()).filter(Boolean);
    if (excl.length) {
      q.state = { $nin: excl };
    }
  }
  if (filter.filters) {
    if (filter.filters.assigneeId) q.assigneeId = filter.filters.assigneeId;
    if (filter.filters.assetId) q.assetId = filter.filters.assetId;
    if (filter.filters.branchId) q.branchId = filter.filters.branchId;
    if (filter.filters.templateId) q.templateId = filter.filters.templateId;
  }
  const total = await WorkOrder.countDocuments(q);
  // Order by orgSeq descending to ensure stable pagination by work order number
  const docs = await WorkOrder.find(q)
    .sort({ orgSeq: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('assigneeId')
    .populate('assetId')
    .populate('templateId')
    .populate('branchId')
    .lean();
  const pages = Math.max(1, Math.ceil(total / limit));

  // analyze parts/insumos/repuestos for returned docs and attach flags
  try {
    const partsMap = analyzeWorkOrdersParts(docs || []);
    if (Array.isArray(docs)) {
      docs.forEach((d: any) => {
        const id = String((d && (d._id || d.id)) || '');
        const p = partsMap[id] || { hasInsumos: false, hasRepuestos: false, parts: [] };
        d.hasInsumos = !!p.hasInsumos;
        d.hasRepuestos = !!p.hasRepuestos;
        d._parts = p.parts || [];
      });
    }
  } catch (e) {
    // non-fatal: don't break listing if parts analysis fails
    console.warn('parts analysis failed', e);
  }

  return { items: docs, total, page, pages };
}

async function addHistory(orgId: string, id: string, entry: any) {
  const updated = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $push: { history: entry } }, { new: true })
    .populate('assigneeId')
    .populate('assetId')
    .populate('templateId')
    .populate('branchId')
    .lean();
  return updated;
}

async function transition(orgId: string, id: string, toState: WorkOrderState, userId?: string, note?: string) {
  const now = new Date();

  // fetch current work order to validate transition
  const current: any = await WorkOrder.findOne({ _id: id, orgId }).lean();
  if (!current) throw { status: 404, message: 'WorkOrder not found' };

  // allowed transitions
  const allowed: Record<string, string[]> = {
    [WORK_ORDER_STATES.CREATED]: [WORK_ORDER_STATES.ASSIGNED],
    [WORK_ORDER_STATES.ASSIGNED]: [WORK_ORDER_STATES.STARTED],
    [WORK_ORDER_STATES.STARTED]: [WORK_ORDER_STATES.UNDER_REVIEW],
    [WORK_ORDER_STATES.UNDER_REVIEW]: [WORK_ORDER_STATES.APPROVED, WORK_ORDER_STATES.REJECTED, WORK_ORDER_STATES.ASSIGNED],
    [WORK_ORDER_STATES.APPROVED]: [],
    [WORK_ORDER_STATES.REJECTED]: []
  };

  const fromState = current.state as WorkOrderState;
  if (!allowed[fromState] || !allowed[fromState].includes(toState)) {
    throw { status: 400, message: `Invalid state transition from ${fromState} to ${toState}` };
  }

  const update: any = { state: toState };
  if (toState === WORK_ORDER_STATES.STARTED) update['dates.start'] = now;
  if (toState === WORK_ORDER_STATES.APPROVED) update['dates.approvedAt'] = now;
  if (toState === WORK_ORDER_STATES.UNDER_REVIEW) update['dates.end'] = now;

  const historyEntry = { userId: userId ? new Types.ObjectId(userId) : undefined, from: fromState, to: toState, note: note || '', at: now };

  const wo = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $set: update, $push: { history: historyEntry } }, { new: true })
    .populate('assigneeId')
    .populate('assetId')
    .populate('templateId')
    .populate('branchId')
    .lean();

  // create notification for assignee when moving to approved or rejected
  try {
    if (wo && (toState === WORK_ORDER_STATES.APPROVED || toState === WORK_ORDER_STATES.REJECTED)) {
      const assignee = (wo as any).assigneeId;
      const assigneeId = assignee ? (assignee._id ? assignee._id.toString() : assignee.toString()) : null;
      const messageKey = toState === WORK_ORDER_STATES.APPROVED ? 'workorder.approved' : 'workorder.rejected';
      if (assigneeId) {
        await notificationsService.createNotification(orgId, assigneeId, userId, messageKey, { workOrderId: id, state: toState });
      }
    }
  } catch (ne) {
    console.error('failed creating notification for state change', ne);
  }
  return wo;
}

async function assign(orgId: string, id: string, assigneeId: string, assignedBy?: string, note?: string) {
  const now = new Date();
  const update = {
    assigneeId: new Types.ObjectId(assigneeId),
    state: WORK_ORDER_STATES.ASSIGNED as WorkOrderState,
    'dates.assignedAt': now
  } as any;

  const wo = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $set: update, $push: { history: { userId: assignedBy ? new Types.ObjectId(assignedBy) : undefined, from: null, to: WORK_ORDER_STATES.ASSIGNED, note: note || '', at: now } } }, { new: true })
    .populate('assigneeId')
    .populate('assetId')
    .populate('templateId')
    .populate('branchId')
    .lean();
  return wo;
}

async function patchData(orgId: string, id: string, data: any, userId?: string) {
  const now = new Date();
  const wo = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $set: { data, 'dates.end': now }, $push: { history: { userId: userId ? new Types.ObjectId(userId) : undefined, from: null, to: WORK_ORDER_STATES.STARTED, note: 'Data updated', at: now } } }, { new: true })
    .populate('assigneeId')
    .populate('assetId')
    .populate('templateId')
    .populate('branchId')
    .lean();
  return wo;
}

async function remove(orgId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await WorkOrder.findOneAndDelete({ _id: id, orgId });
  if (!doc) return null;
  return WorkOrder.findOne({ _id: id }).populate('assigneeId').populate('assetId').populate('templateId').populate('branchId').lean();
}

async function update(orgId: string, id: string, payload: any, userId?: string) {
  if (!Types.ObjectId.isValid(id)) throw { status: 400, message: 'Invalid id' };
  const updateFields: any = {};

  if (payload.templateId) {
    if (!Types.ObjectId.isValid(payload.templateId)) throw { status: 400, message: 'Invalid templateId' };
    updateFields.templateId = new Types.ObjectId(payload.templateId);
  }
  if (payload.data) updateFields.data = payload.data;
  // allow updating progress percentage from frontend (0-100)
  if (typeof payload.progress === 'number') {
    const p = Math.max(0, Math.min(100, Number(payload.progress)));
    updateFields.progress = p;
  }
  if (payload.branchId) {
    if (!Types.ObjectId.isValid(payload.branchId)) throw { status: 400, message: 'Invalid branchId' };
    updateFields.branchId = new Types.ObjectId(payload.branchId);
  }
  if (payload.assetId) {
    if (!Types.ObjectId.isValid(payload.assetId)) throw { status: 400, message: 'Invalid assetId' };
    const asset = await Asset.findOne({ _id: payload.assetId, orgId }).lean();
    if (!asset) throw { status: 400, message: 'Asset not found' };
    updateFields.assetId = new Types.ObjectId(payload.assetId);
  }
  if (payload.scheduledStart) {
    const dt = new Date(payload.scheduledStart);
    if (isNaN(dt.getTime())) throw { status: 400, message: 'Invalid scheduledStart' };
    updateFields['dates.start'] = dt;
  }

  if (payload.urgency) {
    updateFields.urgency = payload.urgency;
  }

  // handle assignee changes (assign via assign function usually)
  if (payload.assigneeId) {
    if (!Types.ObjectId.isValid(payload.assigneeId)) throw { status: 400, message: 'Invalid assigneeId' };
    updateFields.assigneeId = new Types.ObjectId(payload.assigneeId);
    updateFields.state = WORK_ORDER_STATES.ASSIGNED as any;
  }
  // handle explicit dates updates (allow start/end/approvedAt)
  if (payload.dates && typeof payload.dates === 'object') {
    if (payload.dates.start) {
      const dt = new Date(payload.dates.start);
      if (isNaN(dt.getTime())) throw { status: 400, message: 'Invalid dates.start' };
      updateFields['dates.start'] = dt;
    }
    if (payload.dates.end) {
      const dt = new Date(payload.dates.end);
      if (isNaN(dt.getTime())) throw { status: 400, message: 'Invalid dates.end' };
      updateFields['dates.end'] = dt;
    }
    if (payload.dates.approvedAt) {
      const dt = new Date(payload.dates.approvedAt);
      if (isNaN(dt.getTime())) throw { status: 400, message: 'Invalid dates.approvedAt' };
      updateFields['dates.approvedAt'] = dt;
    }
  }

  // handle explicit state change (validate allowed transitions and add history)
  let historyEntry: any = { userId: userId ? new Types.ObjectId(userId) : undefined, from: null, to: 'Modificado', note: 'Work order updated', at: new Date() };
  if (payload.state) {
    // fetch current state to validate transition
    const current: any = await WorkOrder.findOne({ _id: id, orgId }).lean();
    if (!current) throw { status: 404, message: 'WorkOrder not found' };
    const fromState = current.state as string;
    const toState = payload.state as string;
    // allowed transitions (keep in sync with transition())
    const allowed: Record<string, string[]> = {
      [WORK_ORDER_STATES.CREATED]: [WORK_ORDER_STATES.ASSIGNED],
      [WORK_ORDER_STATES.ASSIGNED]: [WORK_ORDER_STATES.STARTED],
      [WORK_ORDER_STATES.STARTED]: [WORK_ORDER_STATES.UNDER_REVIEW],
      [WORK_ORDER_STATES.UNDER_REVIEW]: [WORK_ORDER_STATES.APPROVED, WORK_ORDER_STATES.REJECTED, WORK_ORDER_STATES.ASSIGNED],
      [WORK_ORDER_STATES.APPROVED]: [WORK_ORDER_STATES.UNDER_REVIEW],
      [WORK_ORDER_STATES.REJECTED]: [WORK_ORDER_STATES.UNDER_REVIEW]
    };
    if (fromState !== toState) {
      if (!allowed[fromState] || !allowed[fromState].includes(toState)) {
        throw { status: 400, message: `Invalid state transition from ${fromState} to ${toState}` };
      }
      updateFields.state = toState as any;
      // if dates not provided, set default timestamps for known transitions
      if (!updateFields['dates.start'] && toState === WORK_ORDER_STATES.STARTED) updateFields['dates.start'] = new Date();
      if (!updateFields['dates.end'] && toState === WORK_ORDER_STATES.UNDER_REVIEW) updateFields['dates.end'] = new Date();
      if (!updateFields['dates.approvedAt'] && toState === WORK_ORDER_STATES.APPROVED) updateFields['dates.approvedAt'] = new Date();
      historyEntry = { userId: userId ? new Types.ObjectId(userId) : undefined, from: fromState, to: toState, note: 'Estado actualizado', at: new Date() };
    }
  }
  // ensure we have the work order to derive defaults and template if needed
  const current: any = await WorkOrder.findOne({ _id: id, orgId }).lean();
  if (!current) throw { status: 404, message: 'WorkOrder not found' };

  // Determine scheduledStart: prefer explicit updateFields, otherwise existing value, otherwise derive from template
  let scheduledStart: Date | undefined = updateFields['dates.start'] ? new Date(updateFields['dates.start']) : (current.dates && current.dates.start ? new Date(current.dates.start) : undefined);

  // find template to use for defaults: prefer updated templateId, otherwise current.templateId
  let templateObj: any = null;
  const tplId = updateFields.templateId ? updateFields.templateId : current.templateId;
  try {
    const tplIdStr = tplId && (typeof tplId === 'object' ? (tplId._id || tplId.id) : String(tplId));
    if (tplIdStr && Types.ObjectId.isValid(tplIdStr)) {
      templateObj = await Template.findOne({ _id: tplIdStr, orgId }).lean();
    }
  } catch (e) {
    // ignore template lookup errors
  }

  // If scheduledStart not provided, generate using template.execWindowMinDays (from created date)
  if (!scheduledStart && templateObj) {
    const baseDate = (current.dates && current.dates.created) ? new Date(current.dates.created) : new Date();
    const minDays = typeof templateObj.execWindowMinDays === 'number' ? templateObj.execWindowMinDays : 0;
    scheduledStart = new Date(baseDate.getTime() + minDays * 24 * 60 * 60 * 1000);
    updateFields['dates.start'] = scheduledStart;
  }

  // Recompute estimatedEnd if not provided explicitly, using expectedDurationDays from template (or 1 day default)
  if (!updateFields['dates.end'] && !updateFields['dates.estimatedEnd']) {
    const durDays = (templateObj && typeof templateObj.expectedDurationDays === 'number') ? templateObj.expectedDurationDays : 1;
    if (scheduledStart) {
      const est = new Date(scheduledStart.getTime() + durDays * 24 * 60 * 60 * 1000);
      // store as estimatedEnd to avoid colliding with 'end' which means actual end
      updateFields['dates.estimatedEnd'] = est;
    }
  }

  const wo = await WorkOrder.findOneAndUpdate({ _id: id, orgId }, { $set: updateFields, $push: { history: historyEntry } }, { new: true })
    .populate('assigneeId')
    .populate('assetId')
    .populate('templateId')
    .populate('branchId')
    .lean();
  // create notification for assignee when updating to approved or rejected via update()
  try {
    if (wo && updateFields.state && (updateFields.state === WORK_ORDER_STATES.APPROVED || updateFields.state === WORK_ORDER_STATES.REJECTED)) {
      const assignee = (wo as any).assigneeId;
      const assigneeId = assignee ? (assignee._id ? assignee._id.toString() : assignee.toString()) : null;
      const messageKey = updateFields.state === WORK_ORDER_STATES.APPROVED ? 'workorder.approved' : 'workorder.rejected';
      if (assigneeId) {
        await notificationsService.createNotification(orgId, assigneeId, userId, messageKey, { workOrderId: id, state: updateFields.state });
      }
    }
  } catch (ne) {
    console.error('failed creating notification after update', ne);
  }

  return wo;
}

export default {
  createWorkOrder,
  findById,
  list,
  addHistory,
  transition,
  assign,
  patchData,
  remove,
  update
};
