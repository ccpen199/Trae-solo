const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  plateNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  vehicleType: {
    type: String,
    trim: true
  },
  loadCapacity: {
    type: Number,
    required: true
  },
  driverName: {
    type: String,
    trim: true
  },
  driverPhone: {
    type: String,
    trim: true
  },
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    default: 'idle',
    enum: ['idle', 'working', 'maintenance']
  },
  currentLocation: {
    type: String,
    trim: true
  },
  gpsLocation: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
