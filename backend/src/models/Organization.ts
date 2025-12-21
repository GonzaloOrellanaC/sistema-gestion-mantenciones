import mongoose, { Schema } from 'mongoose';

export interface IOrganization {
  name: string;
  createdAt: Date;
  meta?: any;
  // Trial/payment fields
  trialStartsAt?: Date;
  trialEndsAt?: Date;
  isPaid?: boolean;
}

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  meta: { type: Schema.Types.Mixed },
  trialStartsAt: { type: Date },
  trialEndsAt: { type: Date },
  isPaid: { type: Boolean, default: false }
});

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
