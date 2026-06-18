const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  voucherType: {
    type: String,
    enum: ['amount', 'percentage', 'free'],
    required: true,
  },
  discountValue: Number,
  discountRate: Number,
  maxDiscount: Number,
  minSpend: {
    type: Number,
    default: 0,
  },
  deviceType: {
    type: String,
    enum: ['washer', 'dryer', 'water_dispenser', 'shower', 'all'],
    default: 'all',
  },
  applicableCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  }],
  validity: {
    type: {
      type: String,
      enum: ['fixed', 'relative'],
      default: 'fixed',
    },
    startDate: Date,
    endDate: Date,
    daysAfterReceive: Number,
  },
  source: {
    type: String,
    enum: ['eco_incentive', 'promotion', 'operation', 'compensation', 'referral'],
    default: 'promotion',
  },
  ecoCondition: {
    streakDays: Number,
    minPoints: Number,
    deviceType: String,
  },
  totalQuantity: Number,
  issuedCount: {
    type: Number,
    default: 0,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'disabled'],
    default: 'active',
  },
}, {
  timestamps: true,
});

const userVoucherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true,
  },
  code: String,
  used: {
    type: Boolean,
    default: false,
  },
  usedAt: Date,
  usedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  expiredAt: Date,
  receivedAt: {
    type: Date,
    default: Date.now,
  },
  source: String,
});

userVoucherSchema.index({ userId: 1, used: 1, expiredAt: 1 });

module.exports = {
  Voucher: mongoose.model('Voucher', voucherSchema),
  UserVoucher: mongoose.model('UserVoucher', userVoucherSchema),
};
