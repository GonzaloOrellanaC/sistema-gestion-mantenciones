import mongoose, { Schema } from 'mongoose';

export type MovementType = 'in' | 'out' | 'reserve' | 'consume' | 'adjust' | 'transfer';

export interface IStockMovement {
  orgId: Schema.Types.ObjectId;
  partId: Schema.Types.ObjectId;
  warehouseId?: Schema.Types.ObjectId; // source or target
  toWarehouseId?: Schema.Types.ObjectId; // for transfers
  type: MovementType;
  qty: number;
  referenceId?: Schema.Types.ObjectId; // e.g., workOrderId, purchaseOrderId
  userId?: Schema.Types.ObjectId;
  notes?: string;
  createdAt?: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  partId: { type: Schema.Types.ObjectId, ref: 'Part', required: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  toWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  type: { type: String, required: true },
  qty: { type: Number, required: true },
  referenceId: { type: Schema.Types.ObjectId },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

StockMovementSchema.index({ orgId: 1, partId: 1, createdAt: -1 });

export default mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
