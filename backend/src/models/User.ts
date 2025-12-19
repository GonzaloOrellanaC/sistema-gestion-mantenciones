import mongoose, { Schema } from 'mongoose';

export interface IUser {
  orgId: Schema.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  roleId?: Schema.Types.ObjectId;
  branchId?: Schema.Types.ObjectId;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  createdAt?: Date;
}

const UserSchema = new Schema<IUser>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  isAdmin: { type: Boolean, default: false },
  isSuperAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Ensure emails are unique per organization
UserSchema.index({ orgId: 1, email: 1 }, { unique: true });

export default mongoose.model<IUser>('User', UserSchema);
