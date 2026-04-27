import mongoose, { Schema, Document } from 'mongoose';
import { LivestockType, Gender, LivestockStatus, GrowthBaseline, FeedingPlanItem, VaccineItem } from '../types';

export interface ILivestock extends Document {
  earTagId: string;
  livestockType: LivestockType;
  breed: string;
  gender: Gender;
  birthDate: Date;
  entryWeight: number;
  entryDate: Date;
  source: string;
  barnId: string;
  penId: string;
  status: LivestockStatus;
  
  currentWeight?: number;
  lastFeedingDate?: Date;
  lastVaccinationDate?: Date;
  
  growthBaseline: GrowthBaseline;
  feedingPlan: FeedingPlanItem[];
  vaccineCalendar: VaccineItem[];
  
  consecutiveDeviationDays: number;
  triggeredHealthCheck: boolean;
  
  operatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

const livestockSchema: Schema = new Schema({
  earTagId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  livestockType: {
    type: String,
    enum: Object.values(LivestockType),
    required: true
  },
  breed: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: Object.values(Gender),
    required: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  entryWeight: {
    type: Number,
    required: true,
    min: 0
  },
  entryDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  source: {
    type: String,
    required: true,
    default: 'self_bred'
  },
  barnId: {
    type: String,
    required: true
  },
  penId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(LivestockStatus),
    default: LivestockStatus.IN_BARN
  },
  currentWeight: {
    type: Number,
    min: 0
  },
  lastFeedingDate: {
    type: Date
  },
  lastVaccinationDate: {
    type: Date
  },
  growthBaseline: {
    breed: String,
    dailyGain: [{
      day: Number,
      weight: Number,
      gain: Number
    }],
    feedingStandards: [{
      stage: String,
      startDay: Number,
      endDay: Number,
      dailyFeed: Number
    }],
    vaccineRequirements: [{
      name: String,
      dayRange: [Number, Number],
      mandatory: Boolean
    }]
  },
  feedingPlan: [{
    day: Number,
    stage: String,
    dailyFeedAmount: Number,
    feedType: String
  }],
  vaccineCalendar: [{
    name: String,
    plannedDate: Date,
    mandatory: Boolean,
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending'
    }
  }],
  consecutiveDeviationDays: {
    type: Number,
    default: 0
  },
  triggeredHealthCheck: {
    type: Boolean,
    default: false
  },
  operatorId: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'livestock'
});

livestockSchema.index({ earTagId: 1 });
livestockSchema.index({ status: 1 });
livestockSchema.index({ barnId: 1, penId: 1 });
livestockSchema.index({ livestockType: 1 });
livestockSchema.index({ createdAt: -1 });

export default mongoose.model<ILivestock>('Livestock', livestockSchema);
