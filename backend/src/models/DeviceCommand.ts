import { Schema, model, Document, Types } from 'mongoose';

export type DeviceCommandType = 'reboot' | 'param_config' | 'firmware_upgrade' | 'status_query' | 'factory_reset';
export type DeviceCommandStatus = 'pending' | 'sent' | 'acknowledged' | 'executing' | 'success' | 'failed' | 'timeout';

export interface IDeviceCommand extends Document {
  _id: Types.ObjectId;
  commandId: string;
  deviceId: string;
  type: DeviceCommandType;
  status: DeviceCommandStatus;
  params?: Record<string, unknown>;
  firmwareUrl?: string;
  firmwareVersion?: string;
  result?: Record<string, unknown>;
  errorCode?: number;
  errorMessage?: string;
  progress?: number;
  sentAt?: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  requestData: Record<string, unknown>;
  signature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const deviceCommandSchema = new Schema<IDeviceCommand>(
  {
    commandId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true
    },
    type: {
      type: String,
      enum: ['reboot', 'param_config', 'firmware_upgrade', 'status_query', 'factory_reset'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'acknowledged', 'executing', 'success', 'failed', 'timeout'],
      required: true,
      default: 'pending',
      index: true
    },
    params: Schema.Types.Mixed,
    firmwareUrl: String,
    firmwareVersion: String,
    result: Schema.Types.Mixed,
    errorCode: Number,
    errorMessage: String,
    progress: {
      type: Number,
      min: 0,
      max: 100
    },
    sentAt: Date,
    acknowledgedAt: Date,
    completedAt: Date,
    requestData: {
      type: Schema.Types.Mixed,
      required: true
    },
    signature: String
  },
  {
    timestamps: true
  }
);

deviceCommandSchema.index({ deviceId: 1, createdAt: -1 });
deviceCommandSchema.index({ status: 1, createdAt: -1 });
deviceCommandSchema.index({ type: 1, status: 1 });
deviceCommandSchema.index({ createdAt: -1 });

export const DeviceCommand = model<IDeviceCommand>('DeviceCommand', deviceCommandSchema);
