import mongoose from 'mongoose';

const ShareTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date },
  revoked: { type: Boolean, default: false }
});

export default mongoose.model('ShareToken', ShareTokenSchema);
