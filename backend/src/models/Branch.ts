import mongoose, { Schema } from 'mongoose';

export interface IBranch {
  orgId: Schema.Types.ObjectId;
  name: string;
  address?: string;
  branchType?: Schema.Types.ObjectId;
  meta?: any;
}

const BranchSchema = new Schema<IBranch>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  address: { type: String },
  branchType: { type: Schema.Types.ObjectId, required: true, ref: 'BranchType' },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<IBranch>('Branch', BranchSchema);
