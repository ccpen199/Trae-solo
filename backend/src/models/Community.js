const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
  },
  address: String,
  city: String,
  district: String,
  province: String,
  lat: Number,
  lng: Number,
  propertyCompany: String,
  propertyManager: String,
  propertyPhone: String,
  totalBuildings: Number,
  totalHouseholds: Number,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  deviceCount: {
    type: Number,
    default: 0,
  },
  userCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Community', communitySchema);
