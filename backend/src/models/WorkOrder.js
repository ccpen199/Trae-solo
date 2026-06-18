const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    unique: true,
    required: true,
  },
  type: {
    type: String,
    enum: ['fault', 'maintenance', 'inspection', 'repair', 'install'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  gridId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grid',
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reporterName: String,
  reporterPhone: String,
  assigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: String,
  description: String,
  faultCode: String,
  status: {
    type: String,
    enum: ['pending', 'assigned', 'processing', 'pending_parts', 'completed', 'cancelled', 'rejected'],
    default: 'pending',
  },
  images: [String],
  estimatedTime: Date,
  actualStartTime: Date,
  actualEndTime: Date,
  resolution: String,
  cost: Number,
  parts: [{
    name: String,
    quantity: Number,
    price: Number,
  }],
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  comment: String,
  auditLog: [{
    action: String,
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    operatorName: String,
    timestamp: Date,
    note: String,
  }],
}, {
  timestamps: true,
});

workOrderSchema.index({ status: 1, priority: 1 });
workOrderSchema.index({ deviceId: 1, createdAt: -1 });
workOrderSchema.index({ assigneeId: 1, status: 1 });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
