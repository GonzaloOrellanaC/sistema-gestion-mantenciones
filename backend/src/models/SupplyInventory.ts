import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplyInventory {
  orgId: Schema.Types.ObjectId;
  lotId: Schema.Types.ObjectId; // ref to Lot
  itemId: Schema.Types.ObjectId; // ref to Supply
  branchId?: Schema.Types.ObjectId;
  assetIds?: Schema.Types.ObjectId[];
  initialQuantity: number;
  remainingQuantity: number;
  unitPrice?: number;
  meta?: any;
  createdAt?: Date;
}

export type ISupplyInventoryDoc = ISupplyInventory & Document;

const SupplyInventorySchema = new Schema<ISupplyInventoryDoc>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  lotId: { type: Schema.Types.ObjectId, ref: 'Lot', required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Supply', required: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  assetIds: { type: [Schema.Types.ObjectId], ref: 'Asset', default: [] },
  initialQuantity: { type: Number, required: true },
  remainingQuantity: { type: Number, required: true },
  unitPrice: { type: Number },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

SupplyInventorySchema.index({ orgId: 1, lotId: 1, itemId: 1 });

export default mongoose.model<ISupplyInventoryDoc>('SupplyInventory', SupplyInventorySchema);
