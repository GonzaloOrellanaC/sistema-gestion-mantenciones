import mongoose, { Schema } from 'mongoose';

export interface ITemplate {
  orgId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  structure: any; // JSON schema/structure built by drag-drop builder
  // execution window in days relative to assignment: start between [execWindowMinDays, execWindowMaxDays]
  execWindowMinDays?: number;
  execWindowMaxDays?: number;
  // expected duration in days for the job using this template
  expectedDurationDays?: number;
  previewConfigs?: any;
  assignedAssets?: Schema.Types.ObjectId[];
  templateTypeId?: Schema.Types.ObjectId;
  createdBy?: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

const TemplateSchema = new Schema<ITemplate>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  structure: { type: Schema.Types.Mixed, required: true },
  execWindowMinDays: { type: Number, default: 0 },
  execWindowMaxDays: { type: Number, default: 7 },
  expectedDurationDays: { type: Number, default: 1 },
  previewConfigs: { type: Schema.Types.Mixed },
  assignedAssets: { type: [Schema.Types.ObjectId], ref: 'Asset', default: [] },
  templateTypeId: { type: Schema.Types.ObjectId, ref: 'TemplateType' },
  createdBy: { type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isActive: { type: Boolean, default: true }
});

TemplateSchema.index({ orgId: 1, name: 1 }, { unique: false });

export default mongoose.model<ITemplate>('Template', TemplateSchema);
