import mongoose, { Schema } from 'mongoose';

export interface IEmailLog {
  to: string;
  subject: string;
  template: string;
  body: string;
  result?: any;
  createdAt?: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  template: { type: String, required: true },
  body: { type: String, required: true },
  result: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
