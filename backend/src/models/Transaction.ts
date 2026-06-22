import mongoose, { Document, Schema } from 'mongoose';

export type TransactionStatus = 'pending' | 'deposit_paid' | 'in_progress' | 'stage_completed' | 'completed' | 'disputed' | 'cancelled';
export type PaymentMethod = 'alipay' | 'wechat' | 'bank_transfer';

export interface IStagePayment {
  stageName: string;
  stageIndex: number;
  percentage: number;
  amount: number;
  status: 'pending' | 'released' | 'held';
  requestedAt?: Date;
  confirmedByHomeownerAt?: Date;
  releasedAt?: Date;
  acceptanceReport?: {
    images: string[];
    description: string;
    signature?: {
      homeownerSignature?: string;
      designerSignature?: string;
      signedAt?: Date;
    };
    rating?: number;
  };
}

export interface ITransaction extends Document {
  diaryId: mongoose.Types.ObjectId;
  homeownerId: mongoose.Types.ObjectId;
  designerId: mongoose.Types.ObjectId;
  projectName: string;
  totalAmount: number;
  depositAmount: number;
  depositStatus: 'pending' | 'held' | 'released' | 'refunded';
  depositPaidAt?: Date;
  stages: IStagePayment[];
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  escrowAccount: string;
  dispute?: {
    reason: string;
    raisedBy: mongoose.Types.ObjectId;
    raisedAt: Date;
    resolution?: string;
    resolvedAt?: Date;
    status: 'open' | 'resolved' | 'escalated';
  };
  contractDocument?: string;
  acceptanceDocuments?: string[];
  messages?: Array<{
    userId: mongoose.Types.ObjectId;
    content: string;
    timestamp: Date;
    attachments?: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    diaryId: {
      type: Schema.Types.ObjectId,
      ref: 'Diary',
      required: true,
      index: true
    },
    homeownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    designerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    projectName: {
      type: String,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, '金额不能为负']
    },
    depositAmount: {
      type: Number,
      required: true,
      min: [0, '定金不能为负'],
      validate: {
        validator: function (this: ITransaction, v: number) {
          return v <= this.totalAmount;
        },
        message: '定金不能超过总金额'
      }
    },
    depositStatus: {
      type: String,
      enum: ['pending', 'held', 'released', 'refunded'],
      default: 'pending',
      index: true
    },
    depositPaidAt: { type: Date },
    stages: [
      {
        stageName: { type: String, required: true },
        stageIndex: { type: Number, required: true },
        percentage: { type: Number, required: true, min: 0, max: 100 },
        amount: { type: Number, required: true, min: 0 },
        status: {
          type: String,
          enum: ['pending', 'released', 'held'],
          default: 'pending'
        },
        requestedAt: { type: Date },
        confirmedByHomeownerAt: { type: Date },
        releasedAt: { type: Date },
        acceptanceReport: {
          images: [{ type: String }],
          description: { type: String },
          signature: {
            homeownerSignature: { type: String },
            designerSignature: { type: String },
            signedAt: { type: Date }
          },
          rating: { type: Number, min: 1, max: 5 }
        }
      }
    ],
    paymentMethod: {
      type: String,
      enum: ['alipay', 'wechat', 'bank_transfer'],
      default: 'alipay'
    },
    status: {
      type: String,
      enum: ['pending', 'deposit_paid', 'in_progress', 'stage_completed', 'completed', 'disputed', 'cancelled'],
      default: 'pending',
      index: true
    },
    escrowAccount: {
      type: String,
      required: true,
      default: process.env.ESCROW_ACCOUNT || 'escrow@deco-platform.com'
    },
    dispute: {
      reason: { type: String },
      raisedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      raisedAt: { type: Date },
      resolution: { type: String },
      resolvedAt: { type: Date },
      status: {
        type: String,
        enum: ['open', 'resolved', 'escalated'],
        default: 'open'
      }
    },
    contractDocument: { type: String },
    acceptanceDocuments: [{ type: String }],
    messages: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        attachments: [{ type: String }]
      }
    ]
  },
  {
    timestamps: true
  }
);

TransactionSchema.index({ status: 1, createdAt: -1 });
TransactionSchema.index({ homeownerId: 1, designerId: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
