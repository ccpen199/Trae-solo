const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  installDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['normal', 'maintenance', 'repair', 'scrapped'],
    default: 'normal'
  },
  maintenanceCycle: {
    type: Number,
    required: true, // 保养周期（天）
    default: 30
  },
  nextMaintenanceDate: {
    type: Date,
    required: true
  },
  associatedSpareParts: [{
    sparePartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SparePart'
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
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

module.exports = mongoose.model('Equipment', EquipmentSchema);