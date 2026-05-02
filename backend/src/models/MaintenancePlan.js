const mongoose = require('mongoose');

const MaintenancePlanSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  planDate: {
    type: Date,
    required: true
  },
  executor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'inProgress', 'completed', 'canceled'],
    default: 'pending'
  },
  maintenanceRecord: {
    type: String
  },
  maintenanceTime: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MaintenancePlan', MaintenancePlanSchema);