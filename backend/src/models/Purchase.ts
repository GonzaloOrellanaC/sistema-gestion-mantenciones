import mongoose, { Schema } from 'mongoose';

export interface IPurchase {
  orgId: Schema.Types.ObjectId;
  branchId?: Schema.Types.ObjectId;
  // If purchase is for a specific lot, set `lotId`. Otherwise legacy `itemId`/`itemType` may be present.
  lotId?: Schema.Types.ObjectId;
  itemId?: Schema.Types.ObjectId;
  itemType?: 'part' | 'supply' | string;
  // acquisitionType provides a global classification used across the app
  // values: 'repuestos' | 'insumos' (Spanish terms used in Lot.type)
  acquisitionType?: 'repuestos' | 'insumos' | string;
  // optional items array when purchase references a lot (mirrors Lot.items)
  items?: Array<{ itemId: Schema.Types.ObjectId; quantity: number; unitPrice?: number }>;
  qty?: number;
  date: Date;
  cost?: number;
  supplier?: string;
  notes?: string;
  // extraCosts can store transport, customs, fees, etc.
  extraCosts?: { transport?: number; customs?: number; others?: number };
}

const PurchaseSchema = new Schema<IPurchase>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  lotId: { type: Schema.Types.ObjectId, ref: 'Lot' },
  itemId: { type: Schema.Types.ObjectId },
  itemType: { type: String },
  acquisitionType: { type: String },
  items: { type: [{ itemId: Schema.Types.ObjectId, quantity: Number, unitPrice: Number }], default: [] },
  qty: { type: Number, default: 1 },
  extraCosts: { type: Schema.Types.Mixed },
  date: { type: Date, required: true, index: true },
  cost: { type: Number, default: 0 },
  supplier: { type: String },
  notes: { type: String }
});

PurchaseSchema.index({ orgId: 1, itemId: 1, date: -1 });

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);
