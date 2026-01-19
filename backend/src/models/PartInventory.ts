import mongoose, { Schema, Document } from 'mongoose';

export interface IPartInventory {
  orgId: Schema.Types.ObjectId;
  lotId: Schema.Types.ObjectId; // ref to Lot
  itemId: Schema.Types.ObjectId; // ref to Part
  branchId?: Schema.Types.ObjectId; // branch where inventory is stored
  assetIds?: Schema.Types.ObjectId[]; // optional assets associated
  initialQuantity: number;
  remainingQuantity: number;
  unitPrice?: number;
  meta?: any;
  createdAt?: Date;
}

export type IPartInventoryDoc = IPartInventory & Document;

const PartInventorySchema = new Schema<IPartInventoryDoc>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  lotId: { type: Schema.Types.ObjectId, ref: 'Lot', required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Part', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  assetIds: { type: [Schema.Types.ObjectId], ref: 'Asset', default: [] },
  initialQuantity: { type: Number, required: true },
  remainingQuantity: { type: Number, required: true },
  unitPrice: { type: Number },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

PartInventorySchema.index({ orgId: 1, lotId: 1, itemId: 1 });

export default mongoose.model<IPartInventoryDoc>('PartInventory', PartInventorySchema);
