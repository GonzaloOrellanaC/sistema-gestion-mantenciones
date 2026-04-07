import mongoose, { Schema } from 'mongoose';

export interface IAsset {
  orgId: Schema.Types.ObjectId;
  name: string;
  serial?: string;
  brandId?: Schema.Types.ObjectId;
  modelId?: Schema.Types.ObjectId;
  typeId?: Schema.Types.ObjectId;
  branchId?: Schema.Types.ObjectId;
  notes?: string;
  docs?: Schema.Types.ObjectId[]; // references to FileMeta
  images?: string[]; // list of image URLs or paths
  indexImage?: number; // index into `images` (0-based). If `images` absent, indexImage should be undefined
  createdAt?: Date;
}

const AssetSchema = new Schema<IAsset>({
  orgId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  serial: { type: String },
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
  modelId: { type: Schema.Types.ObjectId, ref: 'DeviceModel' },
  typeId: { type: Schema.Types.ObjectId, ref: 'AssetType' },
  branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
  notes: { type: String },
  docs: { type: [Schema.Types.ObjectId], ref: 'FileMeta', default: [] },
  images: { type: [String], default: [] },
  indexImage: {
    type: Number,
    validate: {
      validator: function (v: number) {
        // `this` is the document. indexImage must be undefined when no images,
        // otherwise must be integer between 0 and images.length - 1
        // allow null/undefined
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc: any = this;
        if (!doc.images || doc.images.length === 0) {
          return v === null || v === undefined;
        }
        // must be an integer within range
        return Number.isInteger(v) && v >= 0 && v < doc.images.length;
      },
      message: 'indexImage must be an integer between 0 and images.length-1 (or undefined if no images)'
    }
  },
  createdAt: { type: Date, default: Date.now }
});

AssetSchema.index({ orgId: 1, name: 1 }, { unique: false });

export default mongoose.model<IAsset>('Asset', AssetSchema);
