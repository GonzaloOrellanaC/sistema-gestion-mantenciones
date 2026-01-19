import mongoose, { Schema } from 'mongoose';

export interface IStock {
  orgId: Schema.Types.ObjectId;
  partId: Schema.Types.ObjectId;
  warehouseId: Schema.Types.ObjectId;
  quantity: number;
  reserved?: number;
  minQty?: number;
  maxQty?: number;
  updatedAt?: Date;
  createdAt?: Date;
}

const StockSchema = new Schema<IStock>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  partId: { type: Schema.Types.ObjectId, ref: 'Part', required: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  quantity: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
  minQty: { type: Number },
  maxQty: { type: Number },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

StockSchema.index({ orgId: 1, partId: 1, warehouseId: 1 }, { unique: true });

export default mongoose.model<IStock>('Stock', StockSchema);
