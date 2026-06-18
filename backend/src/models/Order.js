const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
  },
  orderType: {
    type: String,
    enum: ['booking', 'recharge', 'package', 'penalty', 'refund'],
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['wechat', 'alipay', 'balance', 'voucher'],
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunding', 'refunded', 'failed', 'cancelled'],
    default: 'unpaid',
  },
  amount: {
    type: Number,
    required: true,
  },
  paidAmount: Number,
  balanceUsed: {
    type: Number,
    default: 0,
  },
  voucherUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
  },
  voucherDiscount: {
    type: Number,
    default: 0,
  },
  transactionId: String,
  refundId: String,
  refundReason: String,
  refundAmount: Number,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed'],
    default: 'pending',
  },
  interruptInfo: {
    interrupted: {
      type: Boolean,
      default: false,
    },
    interruptTime: Date,
    interruptReason: String,
    usedDuration: Number,
    autoRefund: Boolean,
  },
  paidAt: Date,
  completedAt: Date,
  expiredAt: Date,
  source: {
    type: String,
    enum: ['wechat', 'alipay', 'app', 'web', 'scan'],
  },
}, {
  timestamps: true,
});

orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ orderNo: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
