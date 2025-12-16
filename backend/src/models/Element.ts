import mongoose, { Schema } from 'mongoose';

export interface IElement {
  orgId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  meta?: any;
}

const ElementSchema = new Schema<IElement>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<IElement>('Element', ElementSchema);
