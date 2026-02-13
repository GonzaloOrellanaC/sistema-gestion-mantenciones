import mongoose, { Schema } from 'mongoose';
import { WORK_ORDER_STATES_ARRAY, WORK_ORDER_STATES, WorkOrderStateValue } from '../utils/workOrderStates';

export type WorkOrderState = WorkOrderStateValue;
export type WorkOrderUrgency = 'Baja' | 'Media' | 'Alta';

export interface IWorkOrder {
  orgId: Schema.Types.ObjectId;
  orgSeq: number; // unique per org
  branchId?: Schema.Types.ObjectId;
  assetId?: Schema.Types.ObjectId;
  templateId?: Schema.Types.ObjectId;
  data?: any; // filled fields according to template
  state: WorkOrderState;
  urgency?: WorkOrderUrgency;
  assigneeId?: Schema.Types.ObjectId;
  client?: any;
  dates?: {
    created?: Date;
    start?: Date;
    end?: Date;
    // date when the work order was assigned
    assignedAt?: Date;
    // scheduled start computed from assignment + template execution window
    scheduledStart?: Date;
    // estimated end / completion date for the work order
    estimatedEnd?: Date;
    approvedAt?: Date;
  };
  history?: Array<any>;
  attachments?: Schema.Types.ObjectId[]; // reference to FileMeta
  deleted?: boolean;
  progress?: number; // 0-100 percentage of completion
}

const WorkOrderSchema = new Schema<IWorkOrder>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
  orgSeq: { type: Number, required: true },
  templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
  data: { type: Schema.Types.Mixed },
  state: { type: String, enum: WORK_ORDER_STATES_ARRAY as any, default: WORK_ORDER_STATES.CREATED },
  urgency: { type: String, enum: ['Baja', 'Media', 'Alta'], default: 'Media' },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  client: { type: Schema.Types.Mixed },
  dates: { type: Schema.Types.Mixed },
  history: { type: [Schema.Types.Mixed], default: [] },
  attachments: { type: [Schema.Types.ObjectId], default: [] },
  // progress percentage (0-100) representing how much of the work order has been completed
  progress: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false }
});

// Ensure orgSeq is unique per organization
WorkOrderSchema.index({ orgId: 1, orgSeq: 1 }, { unique: true });

export default mongoose.model<IWorkOrder>('WorkOrder', WorkOrderSchema);
