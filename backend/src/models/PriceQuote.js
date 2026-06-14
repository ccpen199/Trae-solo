const mongoose = require('mongoose');

const PriceQuoteSchema = new mongoose.Schema({
  wasteCategory: {
    type: String,
    required: true,
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
  estimatedPrice: {
    type: Number,
    required: true
  },
  priceRange: {
    type: String,
    trim: true
  },
  marketReferencePrice: {
    type: Number
  },
  marketTrend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },
  factors: {
    type: Object
  },
  quoteTime: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  formulaVersion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PriceQuote', PriceQuoteSchema);
