const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  orderType: {
    type: String,
    required: true,
    enum: ['recycle', 'purchase']
  },
  wasteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste',
    required: true
  },
  wasteTitle: {
    type: String,
    required: true,
    trim: true
  },
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyerType: {
    type: String,
    required: true,
    enum: ['producer', 'collector', 'processor']
  },
  buyerName: {
    type: String,
    required: true,
    trim: true
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
  sellerName: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'pending_confirm',
    enum: ['pending_confirm', 'confirmed', 'picked_up', 'delivered', 'completed', 'cancelled']
  },
  pickupAddress: {
    type: String,
    trim: true
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  pickupTime: {
    type: String,
    trim: true
  },
  pickupDate: {
    type: Date
  },
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  weighTicketUrl: {
    type: String,
    trim: true
  },
  actualWeight: {
    type: Number
  },
  contractUrl: {
    type: String,
    trim: true
  },
  isContractSigned: {
    type: Boolean,
    default: false
  },
  traceCode: {
    type: String,
    trim: true
  },
  blockchainHash: {
    type: String,
    trim: true
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportTime: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
