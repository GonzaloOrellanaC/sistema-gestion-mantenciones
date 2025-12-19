import mongoose, { Schema } from 'mongoose';

export interface IPushToken {
  orgId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  token: string;
  platform?: string;
  createdAt?: Date;
}

const PushTokenSchema = new Schema<IPushToken>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  token: { type: String, required: true, index: true },
  platform: { type: String },
  createdAt: { type: Date, default: Date.now }
});

PushTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

export default mongoose.model<IPushToken>('PushToken', PushTokenSchema);
