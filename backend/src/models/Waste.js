const mongoose = require('mongoose');

const WasteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['industrial_scrap', 'used_equipment', 'old_appliance', 'household_plastic', 'hazardous']
  },
  subCategory: {
    type: String,
    trim: true
  },
  material: {
    type: String,
    trim: true
  },
  weight: {
    type: Number,
    required: true
  },
  weightUnit: {
    type: String,
    default: 'kg',
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [
    {
      type: String
    }
  ],
  priceType: {
    type: String,
    required: true,
    enum: ['fixed', 'negotiable', 'estimated']
  },
  price: {
    type: Number
  },
  estimatedPrice: {
    type: Number
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerType: {
    type: String,
    required: true,
    enum: ['producer', 'collector', 'processor']
  },
  isHazardous: {
    type: Boolean,
    default: false
  },
  hazardousCode: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'pending_review', 'on_sale', 'sold', 'removed', 'audit_failed']
  },
  reviewStatus: {
    type: String,
    trim: true
  },
  reviewRemark: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  province: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Waste', WasteSchema);
