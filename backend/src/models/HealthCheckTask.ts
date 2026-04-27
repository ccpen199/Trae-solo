import mongoose, { Schema, Document } from 'mongoose';
import { TaskStatus, Priority } from '../types';

export interface IHealthCheckTask extends Document {
  anomalyRecordId: string;
  earTagId: string;
  
  title: string;
  description: string;
  priority: Priority;
  
  assignedTo: string;
  assignedAt: Date;
  
  checkRequirements: {
    temperature: boolean;
    appetite: boolean;
    behavior: boolean;
    feces: boolean;
    additional?: string[];
  };
  
  checkResult?: {
    temperature?: number;
    appetiteStatus?: 'normal' | 'poor' | 'none';
    behaviorStatus?: 'normal' | 'abnormal';
    fecesStatus?: 'normal' | 'abnormal';
    symptoms?: string[];
    preliminaryDiagnosis?: string;
    recommendation?: string;
    needTreatment: boolean;
    needIsolation: boolean;
  };
  
  status: TaskStatus;
  completedAt?: Date;
  completedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const healthCheckTaskSchema: Schema = new Schema({
  anomalyRecordId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  earTagId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: Object.values(Priority),
    default: Priority.HIGH
  },
  assignedTo: {
    type: String,
    required: true,
    index: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  checkRequirements: {
    temperature: {
      type: Boolean,
      default: true
    },
    appetite: {
      type: Boolean,
      default: true
    },
    behavior: {
      type: Boolean,
      default: true
    },
    feces: {
      type: Boolean,
      default: true
    },
    additional: [String]
  },
  checkResult: {
    temperature: Number,
    appetiteStatus: {
      type: String,
      enum: ['normal', 'poor', 'none']
    },
    behaviorStatus: {
      type: String,
      enum: ['normal', 'abnormal']
    },
    fecesStatus: {
      type: String,
      enum: ['normal', 'abnormal']
    },
    symptoms: [String],
    preliminaryDiagnosis: String,
    recommendation: String,
    needTreatment: {
      type: Boolean,
      default: false
    },
    needIsolation: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: Object.values(TaskStatus),
    default: TaskStatus.PENDING,
    index: true
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'health_check_tasks'
});

healthCheckTaskSchema.index({ earTagId: 1, createdAt: -1 });
healthCheckTaskSchema.index({ status: 1, priority: -1, assignedAt: 1 });
healthCheckTaskSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model<IHealthCheckTask>('HealthCheckTask', healthCheckTaskSchema);
