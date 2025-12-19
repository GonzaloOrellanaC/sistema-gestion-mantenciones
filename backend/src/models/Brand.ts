import mongoose, { Schema } from 'mongoose';

export interface IBrand {
  orgId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  createdAt?: Date;
}

const BrandSchema = new Schema<IBrand>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

BrandSchema.index({ orgId: 1, name: 1 }, { unique: false });

export default mongoose.model<IBrand>('Brand', BrandSchema);
