import mongoose, { Schema } from 'mongoose';

export interface ITemplateType {
  orgId: Schema.Types.ObjectId;
  name: string;
  meta?: any;
}

const TemplateTypeSchema = new Schema<ITemplateType>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  meta: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.model<ITemplateType>('TemplateType', TemplateTypeSchema);
