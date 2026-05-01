const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 10000
  },
  tags: [{
    type: String,
    trim: true
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reward: {
    type: {
      type: String,
      enum: ['points', 'money', 'both'],
      default: 'points'
    },
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    money: {
      type: Number,
      default: 0,
      min: 0,
      set: v => Math.round(v * 100) / 100
    },
    isEscrowed: {
      type: Boolean,
      default: false
    }
  },
  semanticAnalysis: {
    parsedTags: [String],
    domain: String,
    complexity: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced', 'expert'],
      default: 'basic'
    },
    keywords: [String],
    entities: [{
      name: String,
      type: String,
      relevance: Number
    }],
    intent: String
  },
  status: {
    type: String,
    enum: [
      'draft',
      'pending_review',
      'published',
      'pending_response',
      'has_answers',
      'accepted',
      'solved',
      'archived',
      'closed',
      'rejected'
    ],
    default: 'draft'
  },
  workflowStatus: {
    type: String,
    enum: [
      'business_request',
      'processing_ticket',
      'associated_credentials',
      'result_confirmation',
      'archived_record'
    ],
    default: 'business_request'
  },
  matchedExperts: [{
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    matchScore: Number,
    notifiedAt: Date,
    respondedAt: Date,
    responseStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'ignored'],
      default: 'pending'
    }
  }],
  stats: {
    viewCount: { type: Number, default: 0 },
    answerCount: { type: Number, default: 0 },
    voteCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isQualityContent: {
    type: Boolean,
    default: false
  },
  isInKnowledgeBase: {
    type: Boolean,
    default: false
  },
  knowledgeBaseNode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeNode'
  },
  moderation: {
    isFlagged: { type: Boolean, default: false },
    flagReason: String,
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: Date,
    isReviewed: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewResult: String
  },
  auditTrail: [{
    action: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    timestamp: { type: Date, default: Date.now },
    details: Object,
    ipAddress: String,
    userAgent: String
  }],
  archivedAt: Date,
  archiveId: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

questionSchema.index({ questionId: 1 }, { unique: true });
questionSchema.index({ author: 1, createdAt: -1 });
questionSchema.index({ status: 1, workflowStatus: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ 'semanticAnalysis.domain': 1 });
questionSchema.index({ 'stats.viewCount': -1 });
questionSchema.index({ isInKnowledgeBase: 1, isQualityContent: 1 });
questionSchema.index({ createdAt: -1 });

questionSchema.pre('save', function(next) {
  if (this.isModified('status') || this.isModified('workflowStatus')) {
    this.auditTrail.push({
      action: 'status_change',
      actor: this.author,
      actorRole: 'system',
      details: {
        newStatus: this.status,
        newWorkflowStatus: this.workflowStatus
      },
      timestamp: new Date()
    });
  }
  next();
});

module.exports = mongoose.model('Question', questionSchema);
