import { Schema, model, Document, Types } from 'mongoose';

export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'fault' | 'upgrading';
export type DeviceModel = 'WD-100' | 'WD-200' | 'WD-300' | 'WD-500';

export interface IDevice extends Document {
  _id: Types.ObjectId;
  deviceId: string;
  deviceName: string;
  deviceModel: DeviceModel;
  deviceSecret: string;
  qrCode: string;
  bluetoothMac?: string;
  firmwareVersion: string;
  hardwareVersion: string;
  projectId: Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
    campus: string;
    building: string;
    floor: string;
    room?: string;
  };
  status: DeviceStatus;
  faultCode?: string;
  faultMessage?: string;
  lastHeartbeatAt?: Date;
  lastOnlineAt?: Date;
  totalWaterUsage: number;
  totalRuntime: number;
  totalTransactions: number;
  totalRevenue: number;
  currentTemperature?: number;
  currentFlowRate?: number;
  isHeating?: boolean;
  hasColdWater: boolean;
  hasHotWater: boolean;
  hasWarmWater: boolean;
  params: {
    targetTempCold: number;
    targetTempWarm: number;
    targetTempHot: number;
    heaterPower: number;
    uvLightOn: boolean;
    autoSterilization: boolean;
    sterilizationInterval: number;
    pricePerLiter: number;
    maxDispenseTime: number;
    minBalanceThreshold: number;
  };
  network: {
    ip?: string;
    ssid?: string;
    signalStrength?: number;
    networkType?: 'wifi' | '4g' | 'ethernet';
  };
  maintenance: {
    lastMaintenanceAt?: Date;
    nextMaintenanceAt?: Date;
    filterLifeRemaining?: number;
    uvLifeRemaining?: number;
    maintenanceCount: number;
  };
  statistics: {
    todayWaterUsage: number;
    todayRuntime: number;
    todayTransactions: number;
    todayRevenue: number;
    weekWaterUsage: number;
    monthWaterUsage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    deviceName: {
      type: String,
      required: true,
      trim: true,
    },
    deviceModel: {
      type: String,
      enum: ['WD-100', 'WD-200', 'WD-300', 'WD-500'],
      required: true,
    },
    deviceSecret: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bluetoothMac: {
      type: String,
      trim: true,
      uppercase: true,
    },
    firmwareVersion: {
      type: String,
      default: '1.0.0',
      trim: true,
    },
    hardwareVersion: {
      type: String,
      default: '1.0.0',
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        default: [0, 0],
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      campus: {
        type: String,
        required: true,
        trim: true,
      },
      building: {
        type: String,
        required: true,
        trim: true,
      },
      floor: {
        type: String,
        required: true,
        trim: true,
      },
      room: String,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'maintenance', 'fault', 'upgrading'],
      default: 'offline',
    },
    faultCode: String,
    faultMessage: String,
    lastHeartbeatAt: Date,
    lastOnlineAt: Date,
    totalWaterUsage: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRuntime: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTransactions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentTemperature: Number,
    currentFlowRate: Number,
    isHeating: Boolean,
    hasColdWater: {
      type: Boolean,
      default: true,
    },
    hasHotWater: {
      type: Boolean,
      default: true,
    },
    hasWarmWater: {
      type: Boolean,
      default: true,
    },
    params: {
      targetTempCold: {
        type: Number,
        default: 8,
        min: 4,
        max: 15,
      },
      targetTempWarm: {
        type: Number,
        default: 45,
        min: 35,
        max: 60,
      },
      targetTempHot: {
        type: Number,
        default: 95,
        min: 80,
        max: 100,
      },
      heaterPower: {
        type: Number,
        default: 2000,
        min: 500,
        max: 5000,
      },
      uvLightOn: {
        type: Boolean,
        default: true,
      },
      autoSterilization: {
        type: Boolean,
        default: true,
      },
      sterilizationInterval: {
        type: Number,
        default: 24,
        min: 1,
        max: 168,
      },
      pricePerLiter: {
        type: Number,
        default: 0.3,
        min: 0,
      },
      maxDispenseTime: {
        type: Number,
        default: 120,
        min: 10,
        max: 600,
      },
      minBalanceThreshold: {
        type: Number,
        default: 1,
        min: 0,
      },
    },
    network: {
      ip: String,
      ssid: String,
      signalStrength: Number,
      networkType: {
        type: String,
        enum: ['wifi', '4g', 'ethernet'],
      },
    },
    maintenance: {
      lastMaintenanceAt: Date,
      nextMaintenanceAt: Date,
      filterLifeRemaining: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      uvLifeRemaining: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      maintenanceCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    statistics: {
      todayWaterUsage: {
        type: Number,
        default: 0,
        min: 0,
      },
      todayRuntime: {
        type: Number,
        default: 0,
        min: 0,
      },
      todayTransactions: {
        type: Number,
        default: 0,
        min: 0,
      },
      todayRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
      weekWaterUsage: {
        type: Number,
        default: 0,
        min: 0,
      },
      monthWaterUsage: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ deviceId: 1 }, { unique: true });
deviceSchema.index({ qrCode: 1 }, { unique: true });
deviceSchema.index({ projectId: 1 });
deviceSchema.index({ status: 1 });
deviceSchema.index({ 'location.coordinates': '2dsphere' });
deviceSchema.index({ createdAt: -1 });
deviceSchema.index({ lastHeartbeatAt: -1 });

export const Device = model<IDevice>('Device', deviceSchema);
