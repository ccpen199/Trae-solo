const mongoose = require('mongoose');

const creditRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recordType: {
    type: String,
    enum: [
      'question_posted',
      'answer_posted',
      'answer_accepted',
      'vote_given',
      'vote_received',
      'content_quality',
      'plagiarism_detected',
      'suspicious_activity',
      'moderation_action',
      'bonus',
      'penalty',
      'expert_engagement',
      'knowledge_contribution',
      'community_involvement'
    ],
    required: true
  },
  operation: {
    type: String,
    enum: ['add', 'subtract', 'set', 'reset'],
    default: 'add'
  },
  amount: {
    type: Number,
    required: true
  },
  previousScore: {
    type: Number,
    required: true
  },
  newScore: {
    type: Number,
    required: true
  },
  previousLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  },
  newLevel: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['question', 'answer', 'vote', 'comment', 'moderation', 'transaction']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.type'
    }
  },
  source: {
    type: String,
    enum: ['system', 'user_action', 'moderator', 'admin', 'quality_engine'],
    default: 'system'
  },
  weight: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 5.0
  },
  isManualOverride: {
    type: Boolean,
    default: false
  },
  overrideBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  overrideReason: String,
  metadata: {
    ruleApplied: String,
    ruleVersion: String,
    calculationDetails: Object,
    riskScore: Number,
    indicators: [String]
  },
  expirationDate: Date,
  isExpired: {
    type: Boolean,
    default: false
  },
  auditTrail: [{
    action: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorType: {
      type: String,
      enum: ['system', 'moderator', 'admin']
    },
    timestamp: { type: Date, default: Date.now },
    details: Object
  }]
}, {
  timestamps: true
});

creditRecordSchema.index({ recordId: 1 }, { unique: true });
creditRecordSchema.index({ user: 1, createdAt: -1 });
creditRecordSchema.index({ recordType: 1, createdAt: -1 });
creditRecordSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });
creditRecordSchema.index({ source: 1, createdAt: -1 });
creditRecordSchema.index({ isExpired: 1, expirationDate: 1 });

creditRecordSchema.pre('save', function(next) {
  if (this.isNew) {
    this.auditTrail.push({
      action: 'credit_record_created',
      actorType: 'system',
      details: {
        recordType: this.recordType,
        operation: this.operation,
        amount: this.amount,
        previousScore: this.previousScore,
        newScore: this.newScore,
        reason: this.reason
      },
      timestamp: new Date()
    });
  }
  next();
});

creditRecordSchema.statics.calculateLevel = function(score) {
  const levels = [
    { level: 'bronze', min: 0, max: 199 },
    { level: 'silver', min: 200, max: 399 },
    { level: 'gold', min: 400, max: 599 },
    { level: 'platinum', min: 600, max: 799 },
    { level: 'diamond', min: 800, max: 1000 }
  ];
  
  for (const { level, min, max } of levels) {
    if (score >= min && score <= max) {
      return level;
    }
  }
  return 'bronze';
};

creditRecordSchema.statics.getWeightByType = function(recordType) {
  const weights = {
    'answer_accepted': 2.0,
    'knowledge_contribution': 1.5,
    'expert_engagement': 1.5,
    'content_quality': 1.2,
    'answer_posted': 1.0,
    'question_posted': 0.5,
    'vote_received': 0.3,
    'vote_given': 0.1,
    'bonus': 1.0,
    'penalty': 2.0,
    'plagiarism_detected': 3.0,
    'suspicious_activity': 2.0,
    'moderation_action': 2.0
  };
  return weights[recordType] || 1.0;
};

module.exports = mongoose.model('CreditRecord', creditRecordSchema);
