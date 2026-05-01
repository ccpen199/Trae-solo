const mongoose = require('mongoose');

const knowledgeNodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  nodeType: {
    type: String,
    enum: [
      'category',
      'topic',
      'concept',
      'question',
      'answer',
      'article',
      'tutorial',
      'reference'
    ],
    required: true
  },
  domain: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  content: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'contentType'
  },
  contentType: {
    type: String,
    enum: ['Question', 'Answer', 'Article']
  },
  parentNodes: [{
    node: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode' },
    relationship: {
      type: String,
      enum: ['subtopic', 'related', 'prerequisite', 'dependency']
    },
    weight: { type: Number, default: 1.0 }
  }],
  childNodes: [{
    node: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode' },
    relationship: {
      type: String,
      enum: ['subtopic', 'related', 'prerequisite', 'dependency']
    },
    weight: { type: Number, default: 1.0 }
  }],
  relatedNodes: [{
    node: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeNode' },
    relationship: {
      type: String,
      enum: ['similar', 'opposite', 'complementary', 'citation']
    },
    score: { type: Number, default: 0.5 },
    keywords: [String]
  }],
  statistics: {
    viewCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    citationCount: { type: Number, default: 0 },
    referenceCount: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0.5 }
  },
  permanentLink: {
    type: String,
    unique: true
  },
  seoInfo: {
    keywords: [String],
    description: String,
    titleTag: String
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  auditTrail: [{
    action: String,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    details: Object
  }]
}, {
  timestamps: true
});

knowledgeNodeSchema.index({ nodeId: 1 }, { unique: true });
knowledgeNodeSchema.index({ permanentLink: 1 }, { unique: true });
knowledgeNodeSchema.index({ nodeType: 1, domain: 1 });
knowledgeNodeSchema.index({ tags: 1 });
knowledgeNodeSchema.index({ 'parentNodes.node': 1 });
knowledgeNodeSchema.index({ 'childNodes.node': 1 });
knowledgeNodeSchema.index({ 'relatedNodes.node': 1 });
knowledgeNodeSchema.index({ 'statistics.qualityScore': -1 });
knowledgeNodeSchema.index({ isPublished: 1, isArchived: 1 });
knowledgeNodeSchema.index({ createdAt: -1 });

knowledgeNodeSchema.pre('save', function(next) {
  if (!this.permalink && this.nodeId) {
    this.permanentLink = `/knowledge/${this.nodeId}`;
  }
  next();
});

knowledgeNodeSchema.methods.addParent = function(parentNodeId, relationship, weight = 1.0) {
  if (!this.parentNodes.some(p => p.node.toString() === parentNodeId)) {
    this.parentNodes.push({
      node: parentNodeId,
      relationship,
      weight
    });
  }
};

knowledgeNodeSchema.methods.addChild = function(childNodeId, relationship, weight = 1.0) {
  if (!this.childNodes.some(c => c.node.toString() === childNodeId)) {
    this.childNodes.push({
      node: childNodeId,
      relationship,
      weight
    });
  }
};

knowledgeNodeSchema.methods.addRelated = function(relatedNodeId, relationship, score = 0.5, keywords = []) {
  const existingIndex = this.relatedNodes.findIndex(r => r.node.toString() === relatedNodeId);
  
  if (existingIndex >= 0) {
    this.relatedNodes[existingIndex] = {
      node: relatedNodeId,
      relationship,
      score,
      keywords
    };
  } else {
    this.relatedNodes.push({
      node: relatedNodeId,
      relationship,
      score,
      keywords
    });
  }
};

knowledgeNodeSchema.methods.calculateQualityScore = async function() {
  let score = 0.5;
  
  if (this.statistics.viewCount > 1000) score += 0.1;
  if (this.statistics.citationCount > 5) score += 0.1;
  if (this.statistics.referenceCount > 10) score += 0.1;
  
  if (this.reviewedBy) score += 0.1;
  if (this.isFeatured) score += 0.1;
  
  if (this.parentNodes.length > 2) score += 0.05;
  if (this.relatedNodes.length > 5) score += 0.05;
  
  this.statistics.qualityScore = Math.min(score, 1.0);
  return this.statistics.qualityScore;
};

module.exports = mongoose.model('KnowledgeNode', knowledgeNodeSchema);
