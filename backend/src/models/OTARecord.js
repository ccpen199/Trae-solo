const mongoose = require('mongoose');

const otaRecordSchema = new mongoose.Schema({
  otaId: { type: String, required: true, unique: true, index: true },
  firmwareVersion: { type: String, required: true },
  previousVersion: { type: String },
  firmwareUrl: { type: String },
  firmwareSize: { type: Number },
  md5Checksum: { type: String },
  releaseNotes: { type: String },
  targetDevices: [{
    deviceId: { type: String, index: true },
    status: { 
      type: String, 
      enum: ['pending', 'downloading', 'downloaded', 'updating', 'success', 'failed', 'cancelled'],
      default: 'pending' 
    },
    progress: { type: Number, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 }
  }],
  totalDevices: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'draft' 
  },
  upgradeStrategy: { type: String, enum: ['manual', 'rolling', 'batch', 'immediate'], default: 'manual' },
  batchSize: { type: Number, default: 10 },
  scheduledTime: { type: Date },
  forceUpgrade: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  approvedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  rollbackAvailable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

otaRecordSchema.index({ status: 1 });
otaRecordSchema.index({ firmwareVersion: 1 });
otaRecordSchema.index({ 'targetDevices.deviceId': 1, 'targetDevices.status': 1 });

module.exports = mongoose.model('OTARecord', otaRecordSchema);
