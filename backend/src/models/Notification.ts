import mongoose, { Schema } from 'mongoose';

export interface INotification {
  orgId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  actorId?: Schema.Types.ObjectId;
  message: string;
  meta?: any;
  read?: boolean;
  createdAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  actorId: { type: Schema.Types.ObjectId },
  message: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);