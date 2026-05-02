const mongoose = require('mongoose');

const RepairOrderSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'inProgress', 'completed', 'rejected', 'closed'],
    default: 'pending'
  },
  faultDescription: {
    type: String,
    required: true
  },
  faultReason: {
    type: String
  },
  solution: {
    type: String
  },
  usedSpareParts: [{
    sparePartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SparePart'
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  repairTime: {
    type: Date
  },
  completionTime: {
    type: Date
  },
  acceptanceStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected']
  },
  acceptanceRemark: {
    type: String
  },
  images: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RepairOrder', RepairOrderSchema);