import mongoose, { Schema } from 'mongoose';

export interface ILot {
  orgId: Schema.Types.ObjectId;
  branchId?: Schema.Types.ObjectId;
  // type now references TypePurchase._id (or can be a legacy string)
  type?: Schema.Types.ObjectId | string;
  code?: string; // lote codigo / referencia
  supplier?: string;
  purchaseDate?: Date;
  price?: number;
  // items inside the lot: reference to part/supply, quantity and optional unit price
  items?: Array<{ itemId: Schema.Types.ObjectId; quantity: number; unitPrice?: number }>;
  meta?: any;
  createdAt?: Date;
}

const LotSchema = new Schema<ILot>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  // store as ObjectId referencing TypePurchase for flexibility; keep legacy compatibility
  type: { type: Schema.Types.ObjectId, ref: 'TypePurchase', required: false },
  code: { type: String },
  supplier: { type: String },
  purchaseDate: { type: Date },
  price: { type: Number, default: 0 },
  items: { type: [{ itemId: Schema.Types.ObjectId, quantity: Number, unitPrice: Number }], default: [] },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

LotSchema.index({ orgId: 1, code: 1 });

export default mongoose.model<ILot>('Lot', LotSchema);
