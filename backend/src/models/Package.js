const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
  },
  deviceType: {
    type: String,
    enum: ['washer', 'dryer', 'water_dispenser', 'shower', 'all'],
    required: true,
  },
  packageType: {
    type: String,
    enum: ['times', 'duration', 'unlimited', 'combo'],
    required: true,
  },
  description: String,
  features: [String],
  pricing: {
    originalPrice: Number,
    sellingPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'CNY',
    },
  },
  benefits: {
    times: Number,
    duration: Number,
    validityDays: Number,
    discountRate: Number,
  },
  applicableCommunities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
  }],
  applicableGrids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grid',
  }],
  limitPerUser: Number,
  totalStock: Number,
  soldCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'expired'],
    default: 'draft',
  },
  startDate: Date,
  endDate: Date,
  sort: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Package', packageSchema);
