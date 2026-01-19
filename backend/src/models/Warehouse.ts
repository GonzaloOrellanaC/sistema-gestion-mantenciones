import mongoose, { Schema } from 'mongoose';

export interface IWarehouse {
  orgId: Schema.Types.ObjectId;
  name: string;
  code?: string;
  location?: string;
  address?: string;
  contact?: string;
  createdAt?: Date;
}

const WarehouseSchema = new Schema<IWarehouse>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String },
  location: { type: String },
  address: { type: String },
  contact: { type: String },
  createdAt: { type: Date, default: Date.now }
});

WarehouseSchema.index({ orgId: 1, name: 1 });

export default mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
