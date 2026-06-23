const mongoose = require('mongoose');

const energyUsageSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true, index: true },
  deviceId: { type: String, required: true, index: true },
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'DormitoryBuilding', required: true, index: true },
  floor: { type: Number, index: true },
  studentId: { type: String, index: true },
  usageType: { type: String, enum: ['hot_water', 'cold_water'], default: 'hot_water' },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  waterVolume: { type: Number, required: true },
  avgFlowRate: { type: Number },
  avgTemperature: { type: Number },
  energyConsumed: { type: Number },
  cost: { type: Number, required: true },
  unitPrice: { type: Number, default: 0.05 },
  season: { type: String, enum: ['spring', 'summer', 'autumn', 'winter'], index: true },
  hourOfDay: { type: Number, min: 0, max: 23, index: true },
  dayOfWeek: { type: Number, min: 0, max: 6, index: true },
  month: { type: Number, min: 1, max: 12, index: true },
  year: { type: Number, index: true },
  isAbnormal: { type: Boolean, default: false },
  abnormalReason: { type: String },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

energyUsageSchema.index({ startTime: -1 });
energyUsageSchema.index({ buildingId: 1, startTime: -1 });
energyUsageSchema.index({ studentId: 1, startTime: -1 });
energyUsageSchema.index({ year: 1, month: 1, buildingId: 1 });

module.exports = mongoose.model('EnergyUsage', energyUsageSchema);
