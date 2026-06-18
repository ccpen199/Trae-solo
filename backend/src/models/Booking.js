const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNo: {
    type: String,
    unique: true,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  deviceType: {
    type: String,
    enum: ['washer', 'dryer', 'water_dispenser', 'shower'],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  mode: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'expired', 'refunded'],
    default: 'pending',
  },
  pricing: {
    basePrice: Number,
    unitPrice: Number,
    totalAmount: Number,
    discountAmount: Number,
    finalAmount: Number,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  source: {
    type: String,
    enum: ['wechat', 'alipay', 'app', 'web'],
  },
  timeSlot: String,
  note: String,
}, {
  timestamps: true,
});

bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ deviceId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
