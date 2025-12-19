import mongoose, { Schema } from 'mongoose';

export interface IAssetType {
  orgId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  createdAt?: Date;
}

const AssetTypeSchema = new Schema<IAssetType>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

AssetTypeSchema.index({ orgId: 1, name: 1 }, { unique: false });

export default mongoose.model<IAssetType>('AssetType', AssetTypeSchema);
