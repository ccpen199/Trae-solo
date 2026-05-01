const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const { Content } = require('./Content');

const NegativeFeedback = sequelize.define('NegativeFeedback', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID'
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '内容ID'
  },
  type: {
    type: DataTypes.ENUM('not_interested', 'already_seen', 'low_quality', 'misleading', 'offensive', 'other'),
    defaultValue: 'not_interested',
    comment: '负反馈类型：not_interested-不感兴趣, already_seen-已经看过, low_quality-低质量, misleading-误导, offensive-令人反感, other-其他'
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '具体原因描述'
  },
  recommendationId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '推荐ID（用于追踪）'
  },
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '会话ID'
  },
  impactWeight: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.0,
    comment: '影响权重（用于调整推荐策略）'
  },
  isProcessed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已处理（更新画像）'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  },
  processingResult: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '处理结果 {tagsAdjusted: [], weightsUpdated: {}}'
  },
  userIp: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '用户IP'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '用户代理'
  }
}, {
  tableName: 'negative_feedbacks',
  timestamps: true,
  comment: '负反馈记录表'
});

const FeedbackTagImpact = sequelize.define('FeedbackTagImpact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  feedbackId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '负反馈记录ID'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID'
  },
  tag: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '受影响的标签'
  },
  tagType: {
    type: DataTypes.ENUM('semantic', 'category', 'keyword'),
    defaultValue: 'semantic',
    comment: '标签类型'
  },
  originalWeight: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0,
    comment: '原始权重'
  },
  newWeight: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0,
    comment: '调整后的权重'
  },
  adjustment: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0,
    comment: '调整幅度'
  },
  isEffective: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否生效'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间（负影响衰减）'
  }
}, {
  tableName: 'feedback_tag_impacts',
  timestamps: true,
  comment: '负反馈标签影响表'
});

NegativeFeedback.belongsTo(User, { foreignKey: 'userId', as: 'user' });
NegativeFeedback.belongsTo(Content, { foreignKey: 'contentId', as: 'content' });

FeedbackTagImpact.belongsTo(NegativeFeedback, { foreignKey: 'feedbackId', as: 'feedback' });
FeedbackTagImpact.belongsTo(User, { foreignKey: 'userId', as: 'user' });

NegativeFeedback.hasMany(FeedbackTagImpact, { foreignKey: 'feedbackId', as: 'tagImpacts' });

module.exports = {
  NegativeFeedback,
  FeedbackTagImpact
};
