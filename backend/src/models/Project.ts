import { Schema, model, Document, Types } from 'mongoose';

export type ProjectStatus = 'planning' | 'active' | 'suspended' | 'completed';

export interface IProject extends Document {
  _id: Types.ObjectId;
  projectCode: string;
  projectName: string;
  description?: string;
  schoolName: string;
  campus?: string;
  address?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: ProjectStatus;
  investorIds: Types.ObjectId[];
  totalInvestment: number;
  startDate?: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  waterPricePerLiter: number;
  maintenanceCostPerDevicePerMonth: number;
  operatorIds: Types.ObjectId[];
  deviceCount: number;
  statistics: {
    totalWaterUsage: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    averageDailyWaterUsage: number;
    averageDailyRevenue: number;
    roiPercentage: number;
    paybackPeriodDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    projectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },
    campus: String,
    address: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'suspended', 'completed'],
      default: 'planning',
    },
    investorIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalInvestment: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: Date,
    expectedEndDate: Date,
    actualEndDate: Date,
    waterPricePerLiter: {
      type: Number,
      default: 0.3,
      min: 0,
    },
    maintenanceCostPerDevicePerMonth: {
      type: Number,
      default: 50,
      min: 0,
    },
    operatorIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deviceCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    statistics: {
      totalWaterUsage: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalProfit: {
        type: Number,
        default: 0,
      },
      averageDailyWaterUsage: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageDailyRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
      roiPercentage: {
        type: Number,
        default: 0,
      },
      paybackPeriodDays: {
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

projectSchema.index({ projectCode: 1 }, { unique: true });
projectSchema.index({ status: 1 });
projectSchema.index({ investorIds: 1 });
projectSchema.index({ 'location.coordinates': '2dsphere' });
projectSchema.index({ createdAt: -1 });

export const Project = model<IProject>('Project', projectSchema);
