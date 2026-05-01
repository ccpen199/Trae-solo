const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  answerId: {
    type: String,
    unique: true,
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 50000
  },
  contentCompleteness: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  writingTime: {
    startedAt: Date,
    submittedAt: Date,
    duration: {
      type: Number,
      default: 0
    }
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: Date,
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  recommendedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  stats: {
    voteCount: { type: Number, default: 0 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 }
  },
  rankScore: {
    type: Number,
    default: 0
  },
  comments: [{
    commentId: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    createdAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    fileType: String,
    fileSize: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  moderation: {
    isFlagged: { type: Boolean, default: false },
    flagReason: String,
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: Date,
    isReviewed: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewResult: String,
    isPlagiarized: { type: Boolean, default: false },
    plagiarismScore: { type: Number, default: 0 },
    plagiarizedFrom: [String]
  },
  auditTrail: [{
    action: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    timestamp: { type: Date, default: Date.now },
    details: Object
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

answerSchema.index({ answerId: 1 }, { unique: true });
answerSchema.index({ question: 1, createdAt: 1 });
answerSchema.index({ author: 1, createdAt: -1 });
answerSchema.index({ isAccepted: 1, isRecommended: 1 });
answerSchema.index({ rankScore: -1, createdAt: -1 });
answerSchema.index({ 'stats.voteCount': -1 });
answerSchema.index({ 'moderation.isPlagiarized': 1, 'moderation.plagiarismScore': -1 });

answerSchema.pre('save', function(next) {
  if (this.isModified('stats.upvotes') || this.isModified('stats.downvotes')) {
    this.stats.voteCount = this.stats.upvotes - this.stats.downvotes;
  }
  
  const now = new Date();
  if (this.writingTime.startedAt && this.writingTime.submittedAt) {
    this.writingTime.duration = Math.floor(
      (this.writingTime.submittedAt - this.writingTime.startedAt) / 1000
    );
  }
  
  this.rankScore = this.calculateRankScore();
  next();
});

answerSchema.methods.calculateRankScore = function() {
  const voteWeight = this.stats.voteCount * 10;
  const completenessWeight = this.contentCompleteness * 0.5;
  const acceptedWeight = this.isAccepted ? 100 : 0;
  const timeDecay = Math.max(0, 1 - (Date.now() - this.createdAt) / (365 * 24 * 60 * 60 * 1000));
  
  return voteWeight + completenessWeight + acceptedWeight + (timeDecay * 50);
};

answerSchema.methods.addAudit = function(action, actor, actorRole, details) {
  this.auditTrail.push({
    action,
    actor,
    actorRole,
    details,
    timestamp: new Date()
  });
};

module.exports = mongoose.model('Answer', answerSchema);
