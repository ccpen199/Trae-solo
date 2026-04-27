import mongoose, { Schema, Document } from 'mongoose';
import { ApprovalStatus } from '../types';

export interface ISlaughterSettlement extends Document {
  earTagId: string;
  
  slaughterDate: Date;
  slaughterWeight: number;
  sellingPrice: number;
  totalRevenue: number;
  
  lifecycleCost: {
    feedCost: number;
    medicineCost: number;
    laborCost: number;
    depreciationCost: number;
    otherCost: number;
    totalCost: number;
  };
  
  grossProfit: number;
  grossProfitMargin: number;
  
  costBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    details: {
      date: Date;
      description: string;
      amount: number;
    }[];
  }[];
  
  approvalStatus: ApprovalStatus;
  freezeReason?: string;
  
  confirmedBy?: string;
  confirmedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const slaughterSettlementSchema: Schema = new Schema({
  earTagId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  slaughterDate: {
    type: Date,
    required: true
  },
  slaughterWeight: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  lifecycleCost: {
    feedCost: {
      type: Number,
      default: 0
    },
    medicineCost: {
      type: Number,
      default: 0
    },
    laborCost: {
      type: Number,
      default: 0
    },
    depreciationCost: {
      type: Number,
      default: 0
    },
    otherCost: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    }
  },
  grossProfit: {
    type: Number,
    required: true
  },
  grossProfitMargin: {
    type: Number,
    required: true
  },
  costBreakdown: [{
    category: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    details: [{
      date: {
        type: Date,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      }
    }]
  }],
  approvalStatus: {
    type: String,
    enum: Object.values(ApprovalStatus),
    default: ApprovalStatus.PENDING,
    index: true
  },
  freezeReason: {
    type: String
  },
  confirmedBy: {
    type: String
  },
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'slaughter_settlements'
});

slaughterSettlementSchema.index({ earTagId: 1, createdAt: -1 });
slaughterSettlementSchema.index({ slaughterDate: -1 });
slaughterSettlementSchema.index({ approvalStatus: 1 });

export default mongoose.model<ISlaughterSettlement>('SlaughterSettlement', slaughterSettlementSchema);
