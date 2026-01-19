import mongoose, { Schema } from 'mongoose';

export interface IMetricsParetoItem {
  id?: Schema.Types.ObjectId | string;
  label: string;
  value: number;
  cumulativePct?: number;
}

export interface IMetricsPareto {
  orgId: Schema.Types.ObjectId;
  type: string; // e.g. 'maintenance-frequency', 'parts-by-asset', 'parts-purchases', 'supplies-purchases'
  startDate?: Date;
  endDate?: Date;
  generatedAt: Date;
  items: IMetricsParetoItem[];
  totals?: Record<string, any>;
}

const MetricsParetoSchema = new Schema<IMetricsPareto>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  generatedAt: { type: Date, default: Date.now },
  items: [{ id: Schema.Types.Mixed, label: String, value: Number, cumulativePct: Number }],
  totals: { type: Schema.Types.Mixed }
});

MetricsParetoSchema.index({ orgId: 1, type: 1, startDate: -1 });

export default mongoose.model<IMetricsPareto>('MetricsPareto', MetricsParetoSchema);
