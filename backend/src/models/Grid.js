const mongoose = require('mongoose');

const gridSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  area: {
    type: String,
    enum: ['building', 'floor', 'zone', 'custom'],
    default: 'building',
  },
  areaRef: String,
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deviceCount: {
    type: Number,
    default: 0,
  },
  faultCount: {
    type: Number,
    default: 0,
  },
  maintenanceCount: {
    type: Number,
    default: 0,
  },
  bounds: {
    ne: { lat: Number, lng: Number },
    sw: { lat: Number, lng: Number },
  },
}, {
  timestamps: true,
});

gridSchema.index({ communityId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Grid', gridSchema);
