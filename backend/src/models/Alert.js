const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true, index: true },
  alertType: { 
    type: String, 
    enum: ['device_offline', 'device_fault', 'water_leak', 'abnormal_usage', 
           'low_signal', 'ota_failed', 'valve_fault', 'high_temperature',
           'low_balance', 'overdraft', 'payment_failed', 'system_error'],
    required: true 
  },
  severity: { type: String, enum: ['info', 'warning', 'critical', 'fatal'], default: 'warning' },
  deviceId: { type: String, index: true },
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'DormitoryBuilding', index: true },
  studentId: { type: String, index: true },
  title: { type: String, required: true },
  description: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  status: { 
    type: String, 
    enum: ['new', 'acknowledged', 'processing', 'resolved', 'closed', 'ignored'], 
    default: 'new' 
  },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  acknowledgedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  resolvedAt: { type: Date },
  resolution: { type: String },
  relatedWorkOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
  notifications: [{
    channel: { type: String, enum: ['sms', 'email', 'app_push', 'wechat', 'voice'] },
    recipient: { type: String },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    error: { type: String }
  }],
  autoResolved: { type: Boolean, default: false },
  autoResolveReason: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ deviceId: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
