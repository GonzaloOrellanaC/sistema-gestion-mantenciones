import mongoose, { Schema } from 'mongoose';

export interface IEmailConfirmationToken {
  userId: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used?: boolean;
}

const EmailConfirmationTokenSchema = new Schema<IEmailConfirmationToken>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  token: { type: String, required: true, index: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
});

export default mongoose.model<IEmailConfirmationToken>('EmailConfirmationToken', EmailConfirmationTokenSchema);
