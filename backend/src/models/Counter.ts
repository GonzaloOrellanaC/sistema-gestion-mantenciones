import mongoose, { Schema } from 'mongoose';

export interface ICounter {
  orgId: Schema.Types.ObjectId;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  orgId: { type: Schema.Types.ObjectId, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

export default mongoose.model<ICounter>('Counter', CounterSchema);
