const mongoose = require('mongoose');

const TransferOrderSchema = new mongoose.Schema({
  transferNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  wasteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waste'
  },
  wasteName: {
    type: String,
    required: true,
    trim: true
  },
  hazardousCode: {
    type: String,
    trim: true
  },
  weight: {
    type: Number,
    required: true
  },
  outProvince: {
    type: String,
    required: true,
    trim: true
  },
  outCity: {
    type: String,
    required: true,
    trim: true
  },
  outEnterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  outEnterpriseName: {
    type: String,
    required: true,
    trim: true
  },
  inProvince: {
    type: String,
    required: true,
    trim: true
  },
  inCity: {
    type: String,
    required: true,
    trim: true
  },
  inEnterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  inEnterpriseName: {
    type: String,
    required: true,
    trim: true
  },
  transporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transporterName: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'submitted', 'approved', 'rejected', 'transferred', 'received']
  },
  approvalRemark: {
    type: String,
    trim: true
  },
  submitTime: {
    type: Date
  },
  approvalTime: {
    type: Date
  },
  completeTime: {
    type: Date
  },
  attachments: [
    {
      type: String
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('TransferOrder', TransferOrderSchema);
