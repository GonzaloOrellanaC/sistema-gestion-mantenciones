import mongoose, { Schema } from 'mongoose';

export interface IDeviceModel {
  orgId: Schema.Types.ObjectId;
  name: string;
  brandId: Schema.Types.ObjectId;
  typeId: Schema.Types.ObjectId;
  description?: string;
  createdAt?: Date;
}

const DeviceModelSchema = new Schema<IDeviceModel>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  typeId: { type: Schema.Types.ObjectId, ref: 'AssetType', required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

DeviceModelSchema.index({ orgId: 1, name: 1 }, { unique: false });

export default mongoose.model<IDeviceModel>('DeviceModel', DeviceModelSchema);
