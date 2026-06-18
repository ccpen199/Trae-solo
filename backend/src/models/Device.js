const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceCode: {
    type: String,
    unique: true,
    required: true,
  },
  deviceType: {
    type: String,
    enum: ['washer', 'dryer', 'water_dispenser', 'shower'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    building: String,
    floor: String,
    room: String,
    address: String,
    lat: Number,
    lng: Number,
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  gridId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grid',
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'faulty', 'retired'],
    default: 'online',
  },
  workingStatus: {
    type: String,
    enum: ['idle', 'running', 'paused', 'reserved', 'completed'],
    default: 'idle',
  },
  protocol: {
    type: String,
    enum: ['mqtt', 'http', 'modbus', 'custom'],
    default: 'mqtt',
  },
  protocolVersion: String,
  capabilities: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  qrCode: String,
  lastHeartbeat: Date,
  totalUsage: {
    type: Number,
    default: 0,
  },
  totalDuration: {
    type: Number,
    default: 0,
  },
  faultCount: {
    type: Number,
    default: 0,
  },
  lastMaintenance: Date,
  nextMaintenance: Date,
  manufacturer: String,
  model: String,
  installDate: Date,
  settings: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  offlineQueue: [{
    command: String,
    params: mongoose.Schema.Types.Mixed,
    timestamp: Date,
    synced: {
      type: Boolean,
      default: false,
    },
  }],
}, {
  timestamps: true,
});

deviceSchema.index({ communityId: 1, deviceType: 1, status: 1 });
deviceSchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('Device', deviceSchema);
