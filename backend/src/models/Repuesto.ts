import mongoose, { Schema } from 'mongoose';

export interface IRepuesto {
  orgId: Schema.Types.ObjectId;
  branchId?: Schema.Types.ObjectId;
  assetId?: Schema.Types.ObjectId; // asset to which this spare may be attached
  name: string;
  serial?: string;
  quantity?: number;
  dateEntry?: Date; // fecha de ingreso a bodega
  dateInUse?: Date; // fecha de utilización en activo
  dateRetired?: Date; // fecha de retiro del activo
  workOrderId?: Schema.Types.ObjectId; // orden de trabajo asociada a la modificación
  notes?: string;
  docs?: Schema.Types.ObjectId[];
  createdAt?: Date;
}

const RepuestoSchema = new Schema<IRepuesto>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
  name: { type: String, required: true },
  serial: { type: String },
  quantity: { type: Number, default: 1 },
  dateEntry: { type: Date },
  dateInUse: { type: Date },
  dateRetired: { type: Date },
  workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder' },
  notes: { type: String },
  docs: { type: [Schema.Types.ObjectId], ref: 'FileMeta', default: [] },
  createdAt: { type: Date, default: Date.now }
});

RepuestoSchema.index({ orgId: 1, name: 1 });

export default mongoose.model<IRepuesto>('Repuesto', RepuestoSchema);
