const mongoose = require('mongoose');

const deviceUsageSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  deviceType: String,
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  gridId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grid',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  mode: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  actualDuration: Number,
  status: {
    type: String,
    enum: ['started', 'paused', 'completed', 'interrupted', 'cancelled'],
  },
  interruptReason: String,
  params: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  metrics: {
    waterUsed: Number,
    electricityUsed: Number,
    temperature: Number,
    weight: Number,
    extra: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

deviceUsageSchema.index({ deviceId: 1, startTime: -1 });
deviceUsageSchema.index({ userId: 1, startTime: -1 });
deviceUsageSchema.index({ communityId: 1, deviceType: 1, startTime: 1 });

module.exports = mongoose.model('DeviceUsage', deviceUsageSchema);
