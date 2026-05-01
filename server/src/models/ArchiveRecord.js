const mongoose = require('mongoose');

const archiveRecordSchema = new mongoose.Schema({
  archiveId: {
    type: String,
    unique: true,
    required: true
  },
  archiveType: {
    type: String,
    enum: [
      'question',
      'answer',
      'transaction',
      'user',
      'credit_record',
      'moderation_action',
      'workflow_item',
      'full_snapshot'
    ],
    required: true
  },
  sourceCollection: {
    type: String,
    required: true
  },
  sourceDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  content: {
    type: Object,
    required: true
  },
  contentHash: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  archivalReason: {
    type: String,
    enum: [
      'workflow_completion',
      'data_retention_policy',
      'user_request',
      'system_maintenance',
      'regulatory_requirement',
      'content_deletion',
      'migration'
    ],
    required: true
  },
  retentionPolicy: {
    type: String,
    enum: ['permanent', '5_years', '10_years', 'custom'],
    default: 'permanent'
  },
  retentionExpiry: Date,
  archiveLocation: {
    type: String,
    enum: ['database', 'file_system', 'object_storage', 'external_archive'],
    default: 'database'
  },
  storagePath: String,
  relatedRecords: [{
    archiveId: String,
    archiveType: String,
    sourceDocumentId: mongoose.Schema.Types.ObjectId,
    relationship: String
  }],
  auditInfo: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdByType: {
      type: String,
      enum: ['system', 'user', 'admin', 'moderator'],
      default: 'system'
    },
    createdAt: { type: Date, default: Date.now },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationHash: String
  },
  accessControl: {
    isRestricted: { type: Boolean, default: false },
    allowedRoles: [{
      type: String,
      enum: ['admin', 'moderator', 'auditor', 'owner']
    }],
    requireReason: { type: Boolean, default: false }
  },
  searchMetadata: {
    keywords: [String],
    entities: [String],
    dates: {
      originalCreated: Date,
      originalUpdated: Date,
      transactionDate: Date
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    amounts: {
      points: Number,
      money: Number
    }
  },
  integrityVerification: {
    lastVerifiedAt: Date,
    verificationStatus: {
      type: String,
      enum: ['valid', 'corrupted', 'pending', 'error'],
      default: 'pending'
    },
    lastChecksum: String,
    checkMismatchDetails: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletionReason: String,
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

archiveRecordSchema.index({ archiveId: 1 }, { unique: true });
archiveRecordSchema.index({ archiveType: 1, createdAt: -1 });
archiveRecordSchema.index({ sourceCollection: 1, sourceDocumentId: 1 });
archiveRecordSchema.index({ contentHash: 1 });
archiveRecordSchema.index({ archivalReason: 1, retentionPolicy: 1 });
archiveRecordSchema.index({ 'searchMetadata.keywords': 1 });
archiveRecordSchema.index({ 'searchMetadata.users': 1 });
archiveRecordSchema.index({ 'searchMetadata.dates.originalCreated': 1 });
archiveRecordSchema.index({ 'integrityVerification.verificationStatus': 1 });
archiveRecordSchema.index({ isDeleted: 1, createdAt: -1 });

archiveRecordSchema.pre('save', function(next) {
  if (!this.searchMetadata) {
    this.searchMetadata = {};
  }
  
  if (!this.searchMetadata.keywords) {
    this.searchMetadata.keywords = [];
  }
  
  if (!this.integrityVerification) {
    this.integrityVerification = {};
  }
  
  if (!this.integrityVerification.verificationStatus) {
    this.integrityVerification.verificationStatus = 'pending';
  }
  
  next();
});

archiveRecordSchema.statics.findBySource = async function(sourceCollection, sourceDocumentId) {
  return this.find({
    sourceCollection,
    sourceDocumentId
  }).sort({ version: -1 });
};

archiveRecordSchema.statics.findLatestBySource = async function(sourceCollection, sourceDocumentId) {
  return this.findOne({
    sourceCollection,
    sourceDocumentId
  }).sort({ version: -1 });
};

archiveRecordSchema.statics.findByKeyword = async function(keyword, limit = 100) {
  return this.find({
    'searchMetadata.keywords': { $regex: keyword, $options: 'i' }
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

archiveRecordSchema.statics.findByUser = async function(userId, archiveType = null) {
  const query = {
    'searchMetadata.users': userId
  };
  
  if (archiveType) {
    query.archiveType = archiveType;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

archiveRecordSchema.methods.calculateContentHash = function() {
  const crypto = require('crypto');
  const contentString = JSON.stringify(this.content);
  return crypto.createHash('sha256').update(contentString).digest('hex');
};

archiveRecordSchema.methods.verifyIntegrity = function() {
  const calculatedHash = this.calculateContentHash();
  
  this.integrityVerification.lastVerifiedAt = new Date();
  this.integrityVerification.lastChecksum = calculatedHash;
  
  if (calculatedHash === this.contentHash) {
    this.integrityVerification.verificationStatus = 'valid';
    this.integrityVerification.checkMismatchDetails = null;
    return true;
  } else {
    this.integrityVerification.verificationStatus = 'corrupted';
    this.integrityVerification.checkMismatchDetails = `Hash mismatch. Expected: ${this.contentHash}, Got: ${calculatedHash}`;
    return false;
  }
};

module.exports = mongoose.model('ArchiveRecord', archiveRecordSchema);
