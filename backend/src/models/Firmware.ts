import { Schema, model, Document, Types } from 'mongoose';

export type FirmwareStatus = 'draft' | 'testing' | 'published' | 'deprecated' | 'recalled';
export type FirmwareTargetModel = 'WD-100' | 'WD-200' | 'WD-300' | 'WD-500';

export interface IFirmware extends Document {
  _id: Types.ObjectId;
  version: string;
  name: string;
  description?: string;
  targetModels: FirmwareTargetModel[];
  fileUrl: string;
  fileSize: number;
  fileHash: string;
  checksum: string;
  status: FirmwareStatus;
  isMandatory: boolean;
  releaseNotes: string[];
  knownIssues?: string;
  minHardwareVersion?: string;
  maxHardwareVersion?: string;
  releaseDate?: Date;
  rolloutPercentage: number;
  rolloutStartDate?: Date;
  uploadedBy: Types.ObjectId;
  downloadCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const firmwareSchema = new Schema<IFirmware>(
  {
    version: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    targetModels: [
      {
        type: String,
        enum: ['WD-100', 'WD-200', 'WD-300', 'WD-500'],
        required: true,
      },
    ],
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    fileHash: {
      type: String,
      required: true,
      trim: true,
    },
    checksum: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'testing', 'published', 'deprecated', 'recalled'],
      default: 'draft',
    },
    isMandatory: {
      type: Boolean,
      default: false,
    },
    releaseNotes: [String],
    knownIssues: String,
    minHardwareVersion: String,
    maxHardwareVersion: String,
    releaseDate: Date,
    rolloutPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    rolloutStartDate: Date,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    successCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

firmwareSchema.index({ version: 1 }, { unique: true });
firmwareSchema.index({ status: 1, targetModels: 1 });
firmwareSchema.index({ createdAt: -1 });

export const Firmware = model<IFirmware>('Firmware', firmwareSchema);
