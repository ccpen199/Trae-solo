import { Schema, model, Document, Types } from 'mongoose';

export type IoTDataType = 'heartbeat' | 'telemetry' | 'event' | 'alert' | 'status_change';

export interface IIoTData extends Document {
  _id: Types.ObjectId;
  deviceId: string;
  type: IoTDataType;
  timestamp: Date;
  isOffline: boolean;
  telemetry?: {
    temperature?: number;
    flowRate?: number;
    totalFlow?: number;
    pressure?: number;
    heaterPower?: number;
    uvLightOn?: boolean;
    valveOpen?: boolean;
    isHeating?: boolean;
    energyConsumption?: number;
    signalStrength?: number;
    batteryLevel?: number;
  };
  event?: {
    eventCode: string;
    eventMessage: string;
    eventData?: Record<string, unknown>;
  };
  alert?: {
    alertLevel: 'info' | 'warning' | 'error' | 'critical';
    alertCode: string;
    alertMessage: string;
    resolved?: boolean;
    resolvedAt?: Date;
  };
  statusChange?: {
    oldStatus: string;
    newStatus: string;
    reason?: string;
  };
  encryptedPayload?: string;
  dataSignature?: string;
  nonce?: string;
  createdAt: Date;
}

const ioTDataSchema = new Schema<IIoTData>(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['heartbeat', 'telemetry', 'event', 'alert', 'status_change'],
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isOffline: {
      type: Boolean,
      default: false,
      index: true,
    },
    telemetry: {
      temperature: Number,
      flowRate: Number,
      totalFlow: Number,
      pressure: Number,
      heaterPower: Number,
      uvLightOn: Boolean,
      valveOpen: Boolean,
      isHeating: Boolean,
      energyConsumption: Number,
      signalStrength: Number,
      batteryLevel: Number,
    },
    event: {
      eventCode: String,
      eventMessage: String,
      eventData: Schema.Types.Mixed,
    },
    alert: {
      alertLevel: {
        type: String,
        enum: ['info', 'warning', 'error', 'critical'],
      },
      alertCode: String,
      alertMessage: String,
      resolved: Boolean,
      resolvedAt: Date,
    },
    statusChange: {
      oldStatus: String,
      newStatus: String,
      reason: String,
    },
    encryptedPayload: {
      type: String,
      select: false,
    },
    dataSignature: String,
    nonce: String,
  },
  {
    timestamps: true,
  }
);

ioTDataSchema.index({ deviceId: 1, timestamp: -1 });
ioTDataSchema.index({ type: 1, timestamp: -1 });
ioTDataSchema.index({ timestamp: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
ioTDataSchema.index({ deviceId: 1, type: 1, timestamp: -1 });

export const IoTData = model<IIoTData>('IoTData', ioTDataSchema);
