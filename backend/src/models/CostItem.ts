import mongoose, { Schema } from 'mongoose';

export interface ICostItem {
  orgId: Schema.Types.ObjectId;
  workOrderId: Schema.Types.ObjectId;
  type: 'labor' | 'part' | 'service' | 'other';
  description?: string;
  amount: number;
  currency?: string;
  userId?: Schema.Types.ObjectId;
  createdAt?: Date;
}

const CostItemSchema = new Schema<ICostItem>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  workOrderId: { type: Schema.Types.ObjectId, ref: 'WorkOrder', required: true, index: true },
  type: { type: String, enum: ['labor', 'part', 'service', 'other'], required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

CostItemSchema.index({ orgId: 1, workOrderId: 1 });

export default mongoose.model<ICostItem>('CostItem', CostItemSchema);
