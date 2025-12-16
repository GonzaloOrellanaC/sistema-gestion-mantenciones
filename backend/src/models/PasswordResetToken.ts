import mongoose, { Schema } from 'mongoose';

export interface IPasswordResetToken {
  userId: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used?: boolean;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  token: { type: String, required: true, index: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
});

export default mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
