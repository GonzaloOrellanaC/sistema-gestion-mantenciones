import mongoose, { Schema, Document } from 'mongoose';

export interface IBranchType extends Document {
  name: string;
  description?: string;
}

const BranchTypeSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }
});

export default mongoose.model<IBranchType>('BranchType', BranchTypeSchema);