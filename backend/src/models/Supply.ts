import mongoose, { Schema, Document } from 'mongoose';

export interface ISupply {
  orgId: Schema.Types.ObjectId;
  branchIds?: Schema.Types.ObjectId[];
  assetIds?: Schema.Types.ObjectId[];
  name: string;
  serial?: string;
  minStock?: number;
  docs?: Schema.Types.ObjectId[];
  createdAt?: Date;
}

export type ISupplyDoc = ISupply & Document;

const SupplySchema = new Schema<ISupplyDoc>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  branchIds: { type: [Schema.Types.ObjectId], ref: 'Branch', default: [] },
  assetIds: { type: [Schema.Types.ObjectId], ref: 'Asset', default: [] },
  name: { type: String, required: true },
  serial: { type: String },
  minStock: { type: Number, default: 0 },
  docs: { type: [Schema.Types.ObjectId], ref: 'FileMeta', default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISupplyDoc>('Supply', SupplySchema);
