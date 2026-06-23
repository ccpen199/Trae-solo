const mongoose = require('mongoose');

const dormitoryBuildingSchema = new mongoose.Schema({
  buildingId: { type: String, required: true, unique: true, index: true },
  buildingName: { type: String, required: true },
  buildingType: { type: String, enum: ['male', 'female', 'mixed'], default: 'mixed' },
  totalFloors: { type: Number, required: true },
  roomsPerFloor: { type: Number, default: 20 },
  totalStudents: { type: Number, default: 0 },
  address: { type: String },
  waterMeterId: { type: String },
  electricityMeterId: { type: String },
  monthlyWaterQuota: { type: Number, default: 1000 },
  monthlyElectricityQuota: { type: Number, default: 2000 },
  deviceCount: { type: Number, default: 0 },
  faultRate: { type: Number, default: 0 },
  avgDailyWaterUsage: { type: Number, default: 0 },
  peakUsageHours: [{
    hour: { type: Number },
    avgUsage: { type: Number }
  }],
  waterMeterData: [{
    date: { type: Date, required: true },
    totalReading: { type: Number, required: true },
    dailyUsage: { type: Number, required: true },
    cost: { type: Number, default: 0 }
  }],
  electricityMeterData: [{
    date: { type: Date, required: true },
    totalReading: { type: Number, required: true },
    dailyUsage: { type: Number, required: true },
    cost: { type: Number, default: 0 }
  }],
  faultHeatMap: [{
    floor: { type: Number, required: true },
    faultCount: { type: Number, default: 0 },
    lastFaultDate: { type: Date }
  }],
  constructionYear: { type: Number },
  lastRenovationDate: { type: Date },
  managerName: { type: String },
  managerPhone: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

dormitoryBuildingSchema.index({ buildingType: 1 });

module.exports = mongoose.model('DormitoryBuilding', dormitoryBuildingSchema);
