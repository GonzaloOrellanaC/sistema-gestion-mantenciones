import mongoose, { Schema, Document } from 'mongoose';

export interface IPart {
  orgId: Schema.Types.ObjectId;
  // allow multiple branches and assets as lists (reference-only master data)
  branchIds?: Schema.Types.ObjectId[];
  assetIds?: Schema.Types.ObjectId[];
  name: string;
  serial?: string;
  minStock?: number;
  docs?: Schema.Types.ObjectId[];
  createdAt?: Date;
}

export type IPartDoc = IPart & Document;

const PartSchema = new Schema<IPartDoc>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  branchIds: { type: [Schema.Types.ObjectId], ref: 'Branch', default: [] },
  assetIds: { type: [Schema.Types.ObjectId], ref: 'Asset', default: [] },
  name: { type: String, required: true },
  serial: { type: String },
  minStock: { type: Number, default: 0 },
  docs: { type: [Schema.Types.ObjectId], ref: 'FileMeta', default: [] },
  createdAt: { type: Date, default: Date.now }
});

PartSchema.index({ orgId: 1, name: 1 });

export default mongoose.model<IPartDoc>('Part', PartSchema);
