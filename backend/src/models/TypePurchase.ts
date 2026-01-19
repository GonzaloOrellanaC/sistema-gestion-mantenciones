import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo genérico para categorizar items en dos tipos:
 * - 'repuestos' (spare parts)
 * - 'insumos' (supplies)
 *
 * Este modelo NO contiene `orgId` para mantenerlo genérico.
 */

export type ItemType = 'repuestos' | 'insumos';

export const ITEM_TYPES: ItemType[] = ['repuestos', 'insumos'];

export interface ITypePurchase {
  type: ItemType;
  label?: string; // nombre amigable opcional
  description?: string;
  meta?: any;
  createdAt?: Date;
}
// define document type combining interface and mongoose Document
export type ITypePurchaseDoc = ITypePurchase & Document;

const TypePurchaseSchema = new Schema<ITypePurchaseDoc>({
  type: { type: String, enum: ITEM_TYPES, required: true, unique: true },
  label: { type: String },
  description: { type: String },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

// Export named helpers + default Mongoose model
export const TypePurchaseModel = mongoose.model<ITypePurchaseDoc>('TypePurchase', TypePurchaseSchema);

export default TypePurchaseModel;
