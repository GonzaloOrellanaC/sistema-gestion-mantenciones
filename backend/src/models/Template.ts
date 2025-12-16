import mongoose, { Schema } from 'mongoose';

export interface ITemplate {
  orgId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  structure: any; // JSON schema/structure built by drag-drop builder
  previewConfigs?: any;
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
  previewConfigs: { type: Schema.Types.Mixed },
  createdBy: { type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isActive: { type: Boolean, default: true }
});

TemplateSchema.index({ orgId: 1, name: 1 }, { unique: false });

export default mongoose.model<ITemplate>('Template', TemplateSchema);
