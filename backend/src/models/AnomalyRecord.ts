import mongoose, { Schema, Document } from 'mongoose';
import { AnomalyType, AnomalyStatus, Priority } from '../types';

export interface IAnomalyRecord extends Document {
  earTagId: string;
  type: AnomalyType;
  
  details: {
    description: string;
    detectedAt: Date;
    relatedRecords?: string[];
    metrics?: {
      actualValue: number;
      baselineValue: number;
      deviation: number;
    };
  };
  
  status: AnomalyStatus;
  priority: Priority;
  
  assignedTo?: string;
  handledAt?: Date;
  handledBy?: string;
  resolution?: string;
  
  notifications: {
    sentAt: Date;
    recipient: string;
    channel: 'system' | 'sms' | 'app_push';
    delivered: boolean;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const anomalyRecordSchema: Schema = new Schema({
  earTagId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(AnomalyType),
    required: true,
    index: true
  },
  details: {
    description: {
      type: String,
      required: true
    },
    detectedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    relatedRecords: [String],
    metrics: {
      actualValue: Number,
      baselineValue: Number,
      deviation: Number
    }
  },
  status: {
    type: String,
    enum: Object.values(AnomalyStatus),
    default: AnomalyStatus.PENDING,
    index: true
  },
  priority: {
    type: String,
    enum: Object.values(Priority),
    default: Priority.MEDIUM,
    index: true
  },
  assignedTo: {
    type: String,
    index: true
  },
  handledAt: {
    type: Date
  },
  handledBy: {
    type: String
  },
  resolution: {
    type: String
  },
  notifications: [{
    sentAt: {
      type: Date,
      default: Date.now
    },
    recipient: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      enum: ['system', 'sms', 'app_push'],
      required: true
    },
    delivered: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true,
  collection: 'anomaly_records'
});

anomalyRecordSchema.index({ earTagId: 1, createdAt: -1 });
anomalyRecordSchema.index({ status: 1, priority: -1, createdAt: 1 });
anomalyRecordSchema.index({ type: 1, createdAt: -1 });
anomalyRecordSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model<IAnomalyRecord>('AnomalyRecord', anomalyRecordSchema);
