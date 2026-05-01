const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const { Content } = require('./Content');

const Interaction = sequelize.define('Interaction', {
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
    type: DataTypes.ENUM('view', 'like', 'unlike', 'share', 'collect', 'uncollect', 'comment', 'read_complete'),
    allowNull: false,
    comment: '互动类型：view-浏览, like-点赞, unlike-取消点赞, share-分享, collect-收藏, uncollect-取消收藏, comment-评论, read_complete-阅读完成'
  },
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '会话ID'
  },
  requestId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '请求ID'
  },
  recommendationId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '推荐ID（用于追踪）'
  },
  viewDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览时长（秒），仅view类型有效'
  },
  scrollDepth: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '滚动深度百分比（0-100）'
  },
  readProgress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '阅读进度百分比（0-100）'
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '来源：feed, search, share, push等'
  },
  deviceInfo: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '设备信息'
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
  tableName: 'interactions',
  timestamps: true,
  comment: '用户互动记录表'
});

const Comment = sequelize.define('Comment', {
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
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '父评论ID（用于回复）'
  },
  replyToUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '回复的用户ID'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '评论内容'
  },
  status: {
    type: DataTypes.ENUM('pending', 'published', 'hidden', 'deleted', 'rejected'),
    defaultValue: 'pending',
    comment: '状态：pending-待审核, published-已发布, hidden-隐藏, deleted-删除, rejected-拒绝'
  },
  filterResult: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '过滤结果 {passed: boolean, reason: string, keywords: []}'
  },
  likeCount: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '点赞数'
  },
  replyCount: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '回复数'
  },
  isTop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否置顶'
  },
  isHot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否热评'
  },
  hotScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '热评分数'
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '审核人ID'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  },
  reviewReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '审核原因'
  }
}, {
  tableName: 'comments',
  timestamps: true,
  paranoid: true,
  comment: '评论表'
});

const ContentLike = sequelize.define('ContentLike', {
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
  status: {
    type: DataTypes.ENUM('active', 'cancelled'),
    defaultValue: 'active',
    comment: '状态：active-点赞中, cancelled-已取消'
  }
}, {
  tableName: 'content_likes',
  timestamps: true,
  comment: '内容点赞表'
});

const ContentCollect = sequelize.define('ContentCollect', {
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
  folderId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '收藏夹ID'
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled'),
    defaultValue: 'active',
    comment: '状态：active-收藏中, cancelled-已取消'
  }
}, {
  tableName: 'content_collects',
  timestamps: true,
  comment: '内容收藏表'
});

Interaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Interaction.belongsTo(Content, { foreignKey: 'contentId', as: 'content' });

Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Content, { foreignKey: 'contentId', as: 'article' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

ContentLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ContentLike.belongsTo(Content, { foreignKey: 'contentId', as: 'content' });

ContentCollect.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ContentCollect.belongsTo(Content, { foreignKey: 'contentId', as: 'content' });

module.exports = {
  Interaction,
  Comment,
  ContentLike,
  ContentCollect
};
