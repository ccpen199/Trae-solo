const mongoose = require('mongoose');

const funnelEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sessionId: String,
  event: {
    type: String,
    enum: ['browse_devices', 'view_device_detail', 'create_booking', 'payment_init', 'payment_success', 'start_device', 'complete_usage', 'cancel_booking', 'report_fault'],
    required: true,
  },
  deviceType: String,
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  source: {
    type: String,
    enum: ['wechat', 'alipay', 'app', 'web', 'scan'],
  },
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

funnelEventSchema.index({ event: 1, timestamp: 1 });
funnelEventSchema.index({ userId: 1, event: 1, timestamp: 1 });
funnelEventSchema.index({ communityId: 1, deviceType: 1, event: 1 });

const ecoIncentiveLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['streak', 'usage', 'eco_points', 'voucher_awarded', 'voucher_claimed'],
    required: true,
  },
  deviceType: String,
  streakDays: Number,
  ecoPoints: Number,
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
  },
  description: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

ecoIncentiveLogSchema.index({ userId: 1, type: 1, timestamp: -1 });

const deviceCommandLogSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  command: {
    type: String,
    required: true,
  },
  params: mongoose.Schema.Types.Mixed,
  protocol: String,
  source: {
    type: String,
    enum: ['user', 'system', 'maintenance', 'offline_sync'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'executed', 'failed', 'timeout'],
    default: 'sent',
  },
  requestId: String,
  response: mongoose.Schema.Types.Mixed,
  errorMessage: String,
  sentAt: Date,
  deliveredAt: Date,
  executedAt: Date,
  fromOffline: {
    type: Boolean,
    default: false,
  },
});

deviceCommandLogSchema.index({ deviceId: 1, status: 1, sentAt: -1 });

module.exports = {
  FunnelEvent: mongoose.model('FunnelEvent', funnelEventSchema),
  EcoIncentiveLog: mongoose.model('EcoIncentiveLog', ecoIncentiveLogSchema),
  DeviceCommandLog: mongoose.model('DeviceCommandLog', deviceCommandLogSchema),
};
