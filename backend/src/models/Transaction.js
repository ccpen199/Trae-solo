const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  studentId: { type: String, required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentAccount', required: true },
  type: { 
    type: String, 
    enum: ['recharge', 'consumption', 'refund', 'transfer', 'freeze', 'unfreeze', 'compensation'],
    required: true 
  },
  subType: { type: String },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['wechat', 'alipay', 'balance', 'card', 'bank', 'cash'] 
  },
  thirdPartyTransactionId: { type: String },
  deviceId: { type: String, index: true },
  deviceInfo: {
    deviceName: { type: String },
    location: { type: String },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'DormitoryBuilding' }
  },
  waterUsage: { type: Number },
  waterTemperature: { type: Number },
  duration: { type: Number },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'refunded', 'cancelled'], 
    default: 'pending' 
  },
  channel: { type: String, enum: ['web', 'mini_program', 'api', 'device', 'admin'], required: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  remark: { type: String },
  bankReconciliation: {
    reconciled: { type: Boolean, default: false },
    reconcileDate: { type: Date },
    reconcileBatchId: { type: String }
  },
  settlementStatus: { type: String, enum: ['pending', 'settled', 'failed'], default: 'pending' },
  settlementDate: { type: Date },
  isReversed: { type: Boolean, default: false },
  reversedTransactionId: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  completedAt: { type: Date }
}, { timestamps: true });

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ studentId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ 'bankReconciliation.reconciled': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
