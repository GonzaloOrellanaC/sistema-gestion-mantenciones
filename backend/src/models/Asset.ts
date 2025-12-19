import mongoose, { Schema } from 'mongoose';

export interface IAsset {
  orgId: Schema.Types.ObjectId;
  name: string;
  serial?: string;
  brandId?: Schema.Types.ObjectId;
  modelId?: Schema.Types.ObjectId;
  typeId?: Schema.Types.ObjectId;
  branchId?: Schema.Types.ObjectId;
  notes?: string;
  docs?: Schema.Types.ObjectId[]; // references to FileMeta
  createdAt?: Date;
}

const AssetSchema = new Schema<IAsset>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  serial: { type: String },
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
  modelId: { type: Schema.Types.ObjectId, ref: 'DeviceModel' },
  typeId: { type: Schema.Types.ObjectId, ref: 'AssetType' },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  notes: { type: String },
  docs: { type: [Schema.Types.ObjectId], ref: 'FileMeta', default: [] },
  createdAt: { type: Date, default: Date.now }
});

AssetSchema.index({ orgId: 1, name: 1 }, { unique: false });

export default mongoose.model<IAsset>('Asset', AssetSchema);
