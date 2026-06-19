import { Schema, model, Document, Types } from 'mongoose';

export type BindType = 'owner' | 'user';

export interface IDeviceBinding extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  deviceId: Types.ObjectId;
  studentPhone: string;
  deviceCode: string;
  bindType: BindType;
  boundAt: Date;
  unboundAt?: Date;
  status: 'active' | 'inactive';
  isActive: boolean;
  totalUsageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceBindingSchema = new Schema<IDeviceBinding>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    studentPhone: {
      type: String,
      required: true,
      match: /^1[3-9]\d{9}$/,
    },
    deviceCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    bindType: {
      type: String,
      enum: ['owner', 'user'],
      default: 'user',
    },
    boundAt: {
      type: Date,
      default: Date.now,
    },
    unboundAt: Date,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalUsageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsedAt: Date,
  },
  {
    timestamps: true,
  }
);

deviceBindingSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
deviceBindingSchema.index({ userId: 1, isActive: 1 });
deviceBindingSchema.index({ deviceId: 1, isActive: 1 });
deviceBindingSchema.index({ boundAt: -1 });

export const DeviceBinding = model<IDeviceBinding>('DeviceBinding', deviceBindingSchema);
