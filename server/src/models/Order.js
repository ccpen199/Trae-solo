const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    unique: true,
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  coursePrice: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    default: null
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['alipay', 'wechat', 'credit_card', 'free'],
    default: 'free'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: {
    type: Date,
    default: null
  },
  transactionId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['created', 'completed', 'cancelled', 'refunded'],
    default: 'created'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.pre('validate', function(next) {
  if (!this.orderNo) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNo = `ORD${timestamp}${random}`;
  }
  next();
});

orderSchema.index({ orderNo: 1 }, { unique: true });
orderSchema.index({ student: 1 });
orderSchema.index({ course: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Order', orderSchema);
