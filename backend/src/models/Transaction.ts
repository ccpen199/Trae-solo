import { Schema, model, Document, Types } from 'mongoose';

export type TransactionType = 'dispense' | 'recharge' | 'refund' | 'bonus' | 'adjustment' | 'deduct' | 'payment';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'success';
export type WaterTemperature = 'cold' | 'warm' | 'hot';
export type PaymentMethod = 'balance' | 'alipay' | 'wechat' | 'card' | 'alipay_h5' | 'wechat_h5';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  transactionNo: string;
  type: TransactionType;
  status: TransactionStatus;
  userId: Types.ObjectId;
  userPhone: string;
  deviceId?: Types.ObjectId;
  deviceCode?: string;
  waterTemperature?: WaterTemperature;
  waterVolume: number;
  avgTemperature?: number;
  minTemperature?: number;
  maxTemperature?: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  pricePerLiter: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  paymentMethod?: PaymentMethod;
  paymentTransactionId?: string;
  paymentGateway?: string;
  isOffline: boolean;
  offlineSyncAt?: Date;
  encryptedData?: string;
  dataSignature?: string;
  nonce?: string;
  refundReason?: string;
  refundedAt?: Date;
  completedAt?: Date;
  failedReason?: string;
  subject?: string;
  description?: string;
  payTime?: Date;
  refundTime?: Date;
  deductTime?: Date;
  thirdPartyTradeNo?: string;
  buyerAccount?: string;
  receiptAmount?: number;
  originalTransactionId?: string | Types.ObjectId;
  investorId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  pricingDetails?: Array<{
    tier: number;
    unitPrice: number;
    amount: number;
    minVolume?: number;
    maxVolume?: number;
  }>;
  billingPeriod?: {
    startTime: Date;
    endTime: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['dispense', 'recharge', 'refund', 'bonus', 'adjustment', 'deduct', 'payment'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'success'],
      required: true,
      default: 'pending',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userPhone: {
      type: String,
      required: true,
      match: /^1[3-9]\d{9}$/,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
    },
    deviceCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    waterTemperature: {
      type: String,
      enum: ['cold', 'warm', 'hot'],
    },
    waterVolume: {
      type: Number,
      default: 0,
      min: 0,
    },
    avgTemperature: Number,
    minTemperature: Number,
    maxTemperature: Number,
    startTime: Date,
    endTime: Date,
    duration: {
      type: Number,
      min: 0,
    },
    pricePerLiter: {
      type: Number,
      required: true,
      default: 0.3,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['balance', 'alipay', 'wechat', 'card', 'alipay_h5', 'wechat_h5'],
    },
    paymentTransactionId: String,
    paymentGateway: String,
    isOffline: {
      type: Boolean,
      default: false,
    },
    offlineSyncAt: Date,
    encryptedData: {
      type: String,
      select: false,
    },
    dataSignature: String,
    nonce: String,
    refundReason: String,
    refundedAt: Date,
    completedAt: Date,
    failedReason: String,
    subject: String,
    description: String,
    payTime: Date,
    refundTime: Date,
    deductTime: Date,
    thirdPartyTradeNo: String,
    buyerAccount: String,
    receiptAmount: Number,
    originalTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    investorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    pricingDetails: [
      {
        tier: Number,
        unitPrice: Number,
        amount: Number,
        minVolume: Number,
        maxVolume: Number,
      },
    ],
    billingPeriod: {
      startTime: Date,
      endTime: Date,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ transactionNo: 1 }, { unique: true });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ deviceId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ isOffline: 1, status: 1 });
transactionSchema.index({ completedAt: -1 });

transactionSchema.virtual('electronicBill').get(function (this: ITransaction) {
  if (this.type !== 'dispense') return null;
  return {
    transactionNo: this.transactionNo,
    deviceCode: this.deviceCode,
    waterTemperature: this.waterTemperature,
    waterVolume: this.waterVolume.toFixed(2),
    avgTemperature: this.avgTemperature?.toFixed(1),
    amount: this.amount.toFixed(2),
    pricePerLiter: this.pricePerLiter.toFixed(2),
    startTime: this.startTime,
    endTime: this.endTime,
    duration: this.duration,
    createdAt: this.createdAt,
  };
});

export const Transaction = model<ITransaction>('Transaction', transactionSchema);
