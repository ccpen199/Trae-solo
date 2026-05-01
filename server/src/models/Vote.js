const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voteId: {
    type: String,
    unique: true,
    required: true
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['question', 'answer', 'comment'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType',
    required: true
  },
  voteType: {
    type: String,
    enum: ['upvote', 'downvote'],
    required: true
  },
  weight: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 5.0
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String,
    enum: ['abusive', 'spam', 'malicious', 'suspicious_pattern', 'other'],
    default: null
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    deviceId: String
  },
  fraudDetection: {
    isSuspicious: { type: Boolean, default: false },
    riskScore: { type: Number, default: 0 },
    indicators: [{
      type: String,
      reason: String,
      confidence: Number
    }],
    detectedAt: Date
  },
  auditTrail: [{
    action: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    details: Object
  }]
}, {
  timestamps: true
});

voteSchema.index({ voteId: 1 }, { unique: true });
voteSchema.index({ voter: 1, targetType: 1, targetId: 1 }, { unique: true });
voteSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
voteSchema.index({ 'fraudDetection.isSuspicious': 1, 'fraudDetection.riskScore': -1 });
voteSchema.index({ 'metadata.ipAddress': 1, createdAt: -1 });

voteSchema.pre('save', function(next) {
  if (this.isNew) {
    this.auditTrail.push({
      action: 'vote_created',
      actor: this.voter,
      details: {
        targetType: this.targetType,
        targetId: this.targetId,
        voteType: this.voteType,
        weight: this.weight
      },
      timestamp: new Date()
    });
  }
  next();
});

voteSchema.statics.calculateVoteStats = async function(targetType, targetId) {
  const votes = await this.find({ targetType, targetId, isFlagged: false });
  
  const upvotes = votes.filter(v => v.voteType === 'upvote').reduce((sum, v) => sum + v.weight, 0);
  const downvotes = votes.filter(v => v.voteType === 'downvote').reduce((sum, v) => sum + v.weight, 0);
  
  return {
    upvotes: Math.floor(upvotes),
    downvotes: Math.floor(downvotes),
    total: Math.floor(upvotes - downvotes)
  };
};

voteSchema.statics.detectVoteFraud = async function(voterId, targetType, targetId) {
  const indicators = [];
  let riskScore = 0;
  
  const recentVotes = await this.find({
    voter: voterId,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
  });
  
  if (recentVotes.length > 10) {
    indicators.push({
      type: 'high_frequency',
      reason: `用户在1小时内投了${recentVotes.length}票，超过正常阈值`,
      confidence: 0.8
    });
    riskScore += 30;
  }
  
  const sameTargetVotes = await this.find({
    targetType,
    targetId,
    'metadata.ipAddress': { $exists: true }
  });
  
  const ipGroups = {};
  sameTargetVotes.forEach(v => {
    if (v.metadata.ipAddress) {
      ipGroups[v.metadata.ipAddress] = (ipGroups[v.metadata.ipAddress] || 0) + 1;
    }
  });
  
  for (const [ip, count] of Object.entries(ipGroups)) {
    if (count > 3) {
      indicators.push({
        type: 'ip_collusion',
        reason: `IP地址${ip}在同一目标下投了${count}票，存在刷票嫌疑`,
        confidence: 0.9
      });
      riskScore += 40;
    }
  }
  
  const voter = await mongoose.model('User').findById(voterId);
  if (voter && voter.creditScore < 50) {
    indicators.push({
      type: 'low_credit',
      reason: `投票者信用分较低(${voter.creditScore})`,
      confidence: 0.5
    });
    riskScore += 15;
  }
  
  return {
    isSuspicious: riskScore >= 40,
    riskScore: Math.min(riskScore, 100),
    indicators
  };
};

module.exports = mongoose.model('Vote', voteSchema);
