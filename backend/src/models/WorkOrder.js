const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  orderType: { 
    type: String, 
    enum: ['installation', 'repair', 'maintenance', 'replacement', 'inspection', 'ota'],
    required: true 
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'pending' 
  },
  deviceId: { type: String, index: true },
  deviceInfo: {
    deviceName: { type: String },
    location: { type: String },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'DormitoryBuilding' },
    floor: { type: Number },
    faultCode: { type: String },
    faultMessage: { type: String }
  },
  title: { type: String, required: true },
  description: { type: String },
  triggerSource: { type: String, enum: ['auto_detection', 'manual', 'alert', 'schedule'], default: 'manual' },
  sourceAlertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', index: true },
  assigneeName: { type: String },
  estimatedTime: { type: Number },
  actualTime: { type: Number },
  partsUsed: [{
    partName: { type: String },
    partNumber: { type: String },
    quantity: { type: Number },
    cost: { type: Number }
  }],
  totalCost: { type: Number, default: 0 },
  inspectionItems: [{
    item: { type: String },
    result: { type: String },
    remark: { type: String }
  }],
  resolution: { type: String },
  images: [{ type: String }],
  signatureUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  createdAt: { type: Date, default: Date.now, index: true },
  assignedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  dueDate: { type: Date },
  slaBreached: { type: Boolean, default: false },
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    submittedBy: { type: String },
    submittedAt: { type: Date }
  }
}, { timestamps: true });

workOrderSchema.index({ status: 1, priority: 1 });
workOrderSchema.index({ assigneeId: 1, status: 1 });
workOrderSchema.index({ createdAt: -1 });
workOrderSchema.index({ 'deviceInfo.buildingId': 1 });

module.exports = mongoose.model('WorkOrder', workOrderSchema);
