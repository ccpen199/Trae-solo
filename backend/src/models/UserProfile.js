const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    comment: '用户ID'
  },
  interests: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '兴趣标签与权重 {tag: weight}'
  },
  categoryPreferences: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '分类偏好 {categoryId: weight}'
  },
  readHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '阅读历史 [{contentId, timestamp, duration}]'
  },
  clickHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '点击历史 [{contentId, timestamp, source}]'
  },
  negativeFeedbacks: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '负反馈历史 [{contentId, reason, timestamp}]'
  },
  totalReadTime: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总阅读时长（秒）'
  },
  totalViewCount: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总浏览次数'
  },
  activeDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '活跃天数'
  },
  lastActiveDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '最后活跃日期'
  },
  userLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '用户等级'
  },
  engagementScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '参与度分数'
  },
  preferenceVector: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '偏好向量（用于推荐算法）'
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  comment: '用户画图表'
});

UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });

const Recommendation = sequelize.define('Recommendation', {
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
  recommendationId: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    comment: '推荐唯一标识（用于追踪）'
  },
  algorithmVersion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '算法版本'
  },
  score: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0,
    comment: '推荐分数'
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '推荐位置（Feed流中的位置）'
  },
  distributionPath: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '分发路径 [step, timestamp, details]'
  },
  status: {
    type: DataTypes.ENUM('pending', 'delivered', 'viewed', 'clicked', 'interacted', 'skipped'),
    defaultValue: 'pending',
    comment: '推荐状态'
  },
  isDelivered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已下发'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下发时间'
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '浏览时间'
  },
  clickedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '点击时间'
  },
  viewDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览时长（秒）'
  },
  requestId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '请求ID（用于追踪）'
  },
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '会话ID'
  }
}, {
  tableName: 'recommendations',
  timestamps: true,
  comment: '推荐记录表'
});

Recommendation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  UserProfile,
  Recommendation
};
