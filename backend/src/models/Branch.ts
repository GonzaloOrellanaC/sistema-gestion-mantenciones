import mongoose, { Schema } from 'mongoose';

export interface IBranch {
  orgId: Schema.Types.ObjectId;
  name: string;
  address?: string;
  meta?: any;
}

const BranchSchema = new Schema<IBranch>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  address: { type: String },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<IBranch>('Branch', BranchSchema);
