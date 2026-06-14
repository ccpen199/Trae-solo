const mongoose = require('mongoose');

const BlockchainRecordSchema = new mongoose.Schema({
  recordType: {
    type: String,
    required: true,
    enum: ['order', 'transfer', 'weigh', 'contract']
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  relatedNo: {
    type: String,
    trim: true
  },
  dataHash: {
    type: String,
    required: true,
    trim: true
  },
  blockNumber: {
    type: Number
  },
  txHash: {
    type: String,
    trim: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  operatorName: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  previousHash: {
    type: String,
    trim: true
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BlockchainRecord', BlockchainRecordSchema);
