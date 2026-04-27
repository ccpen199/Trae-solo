import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedingRecord extends Document {
  earTagId: string;
  groupId?: string;
  
  feedingDate: Date;
  feedType: string;
  requestedAmount: number;
  actualAmount: number;
  leftoverAmount: number;
  
  calculatedWeight?: number;
  dailyGain?: number;
  baselineGain?: number;
  deviation?: number;
  deviationStatus?: 'normal' | 'low' | 'high';
  
  consecutiveDeviationDays: number;
  triggeredHealthCheck: boolean;
  
  operatorId: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedingRecordSchema: Schema = new Schema({
  earTagId: {
    type: String,
    required: true,
    index: true
  },
  groupId: {
    type: String,
    index: true
  },
  feedingDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  feedType: {
    type: String,
    required: true
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  actualAmount: {
    type: Number,
    required: true,
    min: 0
  },
  leftoverAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  calculatedWeight: {
    type: Number,
    min: 0
  },
  dailyGain: {
    type: Number
  },
  baselineGain: {
    type: Number
  },
  deviation: {
    type: Number
  },
  deviationStatus: {
    type: String,
    enum: ['normal', 'low', 'high']
  },
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
  },
  notes: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'feeding_records'
});

feedingRecordSchema.index({ earTagId: 1, feedingDate: -1 });
feedingRecordSchema.index({ feedingDate: -1 });
feedingRecordSchema.index({ deviationStatus: 1 });
feedingRecordSchema.index({ operatorId: 1 });

export default mongoose.model<IFeedingRecord>('FeedingRecord', feedingRecordSchema);
