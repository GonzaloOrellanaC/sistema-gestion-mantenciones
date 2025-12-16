import mongoose, { Schema } from 'mongoose';

export interface IDepartment {
  orgId: Schema.Types.ObjectId;
  name: string;
  meta?: any;
}

const DepartmentSchema = new Schema<IDepartment>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<IDepartment>('Department', DepartmentSchema);
