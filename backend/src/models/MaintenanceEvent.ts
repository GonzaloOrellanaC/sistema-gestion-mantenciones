import mongoose, { Schema } from 'mongoose';

export interface IMaintenanceEvent {
  orgId: Schema.Types.ObjectId;
  assetId: Schema.Types.ObjectId;
  date: Date;
  type?: string; // preventive | corrective
  durationMinutes?: number;
  cost?: number;
  partsUsed?: { partId: Schema.Types.ObjectId; qty: number }[];
  suppliesUsed?: { supplyId: Schema.Types.ObjectId; qty: number }[];
  notes?: string;
  createdBy?: Schema.Types.ObjectId;
}

const MaintenanceEventSchema = new Schema<IMaintenanceEvent>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
  date: { type: Date, required: true, index: true },
  type: { type: String },
  durationMinutes: { type: Number },
  cost: { type: Number, default: 0 },
  partsUsed: [{ partId: { type: Schema.Types.ObjectId, ref: 'Part' }, qty: { type: Number, default: 1 } }],
  suppliesUsed: [{ supplyId: { type: Schema.Types.ObjectId, ref: 'Supply' }, qty: { type: Number, default: 1 } }],
  notes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

MaintenanceEventSchema.index({ orgId: 1, assetId: 1, date: -1 });

export default mongoose.model<IMaintenanceEvent>('MaintenanceEvent', MaintenanceEventSchema);
