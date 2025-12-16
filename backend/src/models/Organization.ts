import mongoose, { Schema } from 'mongoose';

export interface IOrganization {
  name: string;
  createdAt: Date;
  meta?: any;
}

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
