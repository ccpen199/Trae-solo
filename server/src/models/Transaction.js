const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  transactionType: {
    type: String,
    enum: [
      'reward_escrow',
      'reward_release',
      'reward_rollback',
      'reward_settlement',
      'points_earn',
      'points_spend',
      'points_transfer',
      'refund',
      'platform_fee',
      'bonus',
      'penalty',
      'withdraw',
      'deposit'
    ],
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded'
    ],
    default: 'pending'
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    set: v => Math.round(v * 100) / 100
  },
  currency: {
    type: String,
    enum: ['CNY', 'USD', 'points'],
    default: 'CNY'
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  fee: {
    type: Number,
    default: 0,
    set: v => Math.round(v * 100) / 100
  },
  feePercent: {
    type: Number,
    default: 0.1
  },
  netAmount: {
    type: Number,
    default: 0,
    set: v => Math.round(v * 100) / 100
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['question', 'answer', 'vote', 'moderation', 'other'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.type',
      required: true
    }
  },
  settlementEngine: {
    engineVersion: String,
    ruleSet: String,
    calculationDetails: Object,
    processedAt: Date
  },
  paymentMethod: {
    type: String,
    enum: ['balance', 'alipay', 'wechat', 'bank_card', 'points']
  },
  externalTransactionId: String,
  externalGateway: String,
  reason: {
    type: String,
    maxlength: 500
  },
  metadata: {
    questionId: String,
    answerId: String,
    rewardType: String,
    settlementRule: Object,
    originalAmount: Number
  },
  auditTrail: [{
    action: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorType: {
      type: String,
      enum: ['user', 'system', 'admin']
    },
    timestamp: { type: Date, default: Date.now },
    details: Object,
    ipAddress: String,
    userAgent: String
  }],
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  failureReason: String
}, {
  timestamps: true
});

transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ fromUser: 1, createdAt: -1 });
transactionSchema.index({ toUser: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ transactionType: 1, createdAt: -1 });
transactionSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });
transactionSchema.index({ externalTransactionId: 1 });

transactionSchema.pre('save', function(next) {
  if (this.amount && this.feePercent) {
    this.fee = Math.round(this.amount * this.feePercent * 100) / 100;
    this.netAmount = Math.round((this.amount - this.fee) * 100) / 100;
  }
  next();
});

transactionSchema.methods.addAudit = function(action, actor, actorType, details, ipAddress, userAgent) {
  this.auditTrail.push({
    action,
    actor,
    actorType,
    details,
    ipAddress,
    userAgent,
    timestamp: new Date()
  });
};

transactionSchema.methods.updateStatus = function(newStatus, reason, actor, actorType) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'failed') {
    this.failedAt = new Date();
    this.failureReason = reason;
  }
  
  this.addAudit(
    'status_change',
    actor,
    actorType,
    { oldStatus, newStatus, reason },
    null,
    null
  );
};

module.exports = mongoose.model('Transaction', transactionSchema);
