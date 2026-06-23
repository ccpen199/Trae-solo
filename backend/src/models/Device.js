const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, index: true },
  deviceName: { type: String, required: true },
  deviceType: { type: String, enum: ['shower', 'washing', 'drinking'], default: 'shower' },
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'DormitoryBuilding', required: true },
  floor: { type: Number, required: true },
  roomNumber: { type: String },
  location: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['online', 'offline', 'maintenance', 'sleep', 'fault'], 
    default: 'offline' 
  },
  firmwareVersion: { type: String, default: '1.0.0' },
  targetFirmwareVersion: { type: String },
  otaStatus: { type: String, enum: ['idle', 'downloading', 'updating', 'success', 'failed'], default: 'idle' },
  otaProgress: { type: Number, default: 0 },
  nbIotImei: { type: String, unique: true },
  simCardNumber: { type: String },
  signalStrength: { type: Number, min: 0, max: 31 },
  lastHeartbeat: { type: Date },
  lastWaterUsage: { type: Number, default: 0 },
  totalWaterUsage: { type: Number, default: 0 },
  powerStatus: { type: String, enum: ['normal', 'low', 'abnormal'], default: 'normal' },
  valveStatus: { type: String, enum: ['open', 'closed', 'fault'], default: 'closed' },
  currentFlowRate: { type: Number, default: 0 },
  currentTemperature: { type: Number },
  faultCode: { type: String },
  faultMessage: { type: String },
  isSleepMode: { type: Boolean, default: false },
  sleepSchedule: {
    enabled: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date }
  },
  installDate: { type: Date, default: Date.now },
  lastMaintenanceDate: { type: Date },
  maintenanceCount: { type: Number, default: 0 },
  manufacturer: { type: String },
  modelNumber: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

deviceSchema.index({ status: 1 });
deviceSchema.index({ buildingId: 1, floor: 1 });
deviceSchema.index({ lastHeartbeat: 1 });

module.exports = mongoose.model('Device', deviceSchema);
