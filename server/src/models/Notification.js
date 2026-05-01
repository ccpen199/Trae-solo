const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true,
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notificationType: {
    type: String,
    enum: [
      'question_posted',
      'expert_match',
      'answer_received',
      'answer_accepted',
      'vote_received',
      'comment_received',
      'content_featured',
      'content_flagged',
      'moderation_action',
      'credit_update',
      'transaction_complete',
      'system_announcement',
      'knowledge_update',
      'reminder'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  data: {
    questionId: String,
    answerId: String,
    transactionId: String,
    creditRecordId: String,
    expertMatchScore: Number,
    matchedExpertCount: Number,
    additionalData: Object
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['Question', 'Answer', 'Transaction', 'CreditRecord', 'User']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedEntity.type'
    }
  },
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'push', 'sms'],
    default: ['in_app']
  }],
  deliveryStatus: {
    in_app: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionDeadline: Date,
  actionCompleted: {
    type: Boolean,
    default: false
  },
  actionCompletedAt: Date,
  source: {
    type: String,
    enum: ['system', 'user', 'admin', 'moderator'],
    default: 'system'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    location: String
  },
  auditTrail: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    details: Object
  }]
}, {
  timestamps: true
});

notificationSchema.index({ notificationId: 1 }, { unique: true });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ notificationType: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });
notificationSchema.index({ isArchived: 1, createdAt: -1 });
notificationSchema.index({ actionRequired: 1, actionDeadline: 1 });

notificationSchema.pre('save', function(next) {
  if (this.isNew) {
    this.auditTrail.push({
      action: 'notification_created',
      details: {
        notificationType: this.notificationType,
        priority: this.priority,
        recipient: this.recipient
      },
      timestamp: new Date()
    });
  }
  
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
    this.auditTrail.push({
      action: 'notification_read',
      timestamp: new Date()
    });
  }
  
  next();
});

notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.auditTrail.push({
    action: 'marked_read',
    timestamp: new Date()
  });
};

notificationSchema.methods.markAsArchived = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.auditTrail.push({
    action: 'archived',
    timestamp: new Date()
  });
};

notificationSchema.methods.updateDeliveryStatus = function(channel, status, error = null) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel].sent = true;
    this.deliveryStatus[channel].sentAt = new Date();
    
    if (error) {
      this.deliveryStatus[channel].error = error;
    }
    
    this.auditTrail.push({
      action: `delivery_update_${channel}`,
      details: { status, error },
      timestamp: new Date()
    });
  }
};

notificationSchema.statics.getUnreadCount = async function(recipientId) {
  return this.countDocuments({
    recipient: recipientId,
    isRead: false,
    isArchived: false
  });
};

notificationSchema.statics.getByType = async function(recipientId, notificationType, limit = 50) {
  return this.find({
    recipient: recipientId,
    notificationType,
    isArchived: false
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

notificationSchema.statics.getPendingActions = async function(recipientId) {
  return this.find({
    recipient: recipientId,
    actionRequired: true,
    actionCompleted: false,
    isArchived: false,
    $or: [
      { actionDeadline: { $exists: false } },
      { actionDeadline: { $gt: new Date() } }
    ]
  })
  .sort({ priority: -1, actionDeadline: 1, createdAt: -1 });
};

module.exports = mongoose.model('Notification', notificationSchema);
