import mongoose, { Schema } from 'mongoose';

export interface ISupply {
  orgId: Schema.Types.ObjectId;
  name: string;
  sku?: string;
  unit?: string;
  meta?: any;
}

const SupplySchema = new Schema<ISupply>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  sku: { type: String },
  unit: { type: String },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<ISupply>('Supply', SupplySchema);
