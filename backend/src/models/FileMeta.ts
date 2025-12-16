import mongoose, { Schema } from 'mongoose';

export interface IFileMeta {
  orgId: Schema.Types.ObjectId;
  uploaderId?: Schema.Types.ObjectId;
  filename: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  storage?: string; // gridfs | s3 | local
  path?: string; // if using S3 or local path
  createdAt?: Date;
  meta?: any;
}

const FileMetaSchema = new Schema<IFileMeta>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  uploaderId: { type: Schema.Types.ObjectId },
  filename: { type: String, required: true },
  originalName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  storage: { type: String, default: 'gridfs' },
  path: { type: String },
  createdAt: { type: Date, default: Date.now },
  meta: { type: Schema.Types.Mixed }
});

export default mongoose.model<IFileMeta>('FileMeta', FileMetaSchema);
