import { Schema, model, Document, Types } from 'mongoose';

export type WorkOrderType = 'repair' | 'maintenance' | 'inspection' | 'installation' | 'firmware_upgrade';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkOrderStatus = 'created' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface IWorkOrder extends Document {
  _id: Types.ObjectId;
  orderNo: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  title: string;
  description: string;
  deviceId: Types.ObjectId;
  deviceCode: string;
  faultCode?: string;
  reporterId?: Types.ObjectId;
  reporterPhone?: string;
  assigneeId?: Types.ObjectId;
  assigneeName?: string;
  scheduledDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  actualDuration?: number;
  cost: {
    partsCost: number;
    laborCost: number;
    travelCost: number;
    otherCost: number;
    totalCost: number;
  };
  resolution?: string;
  partsReplaced?: Array<{
    partName: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
  }>;
  beforeImages?: string[];
  afterImages?: string[];
  signature?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workOrderSchema = new Schema<IWorkOrder>(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['repair', 'maintenance', 'inspection', 'installation', 'firmware_upgrade'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['created', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'created',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    deviceCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    faultCode: String,
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reporterPhone: String,
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assigneeName: String,
    scheduledDate: Date,
    startedAt: Date,
    completedAt: Date,
    estimatedDuration: Number,
    actualDuration: Number,
    cost: {
      partsCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      laborCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      travelCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      otherCost: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalCost: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    resolution: String,
    partsReplaced: [
      {
        partName: String,
        partNumber: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    beforeImages: [String],
    afterImages: [String],
    signature: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

workOrderSchema.index({ orderNo: 1 }, { unique: true });
workOrderSchema.index({ deviceId: 1, createdAt: -1 });
workOrderSchema.index({ assigneeId: 1, status: 1 });
workOrderSchema.index({ status: 1, priority: 1 });
workOrderSchema.index({ type: 1, createdAt: -1 });
workOrderSchema.index({ createdAt: -1 });

export const WorkOrder = model<IWorkOrder>('WorkOrder', workOrderSchema);
