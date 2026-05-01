const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyActiveUser = sequelize.define('DailyActiveUser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
    comment: '日期'
  },
  dau: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '日活跃用户数'
  },
  newUsers: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '新增用户数'
  },
  activeUsersByHour: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '每小时活跃用户数 {0: count, 1: count, ..., 23: count}'
  },
  totalSessions: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总会话数'
  },
  avgSessionDuration: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '平均会话时长（秒）'
  },
  totalPageViews: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总页面浏览数'
  },
  totalContentViews: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总内容浏览数'
  },
  avgReadDuration: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '平均阅读时长（秒）'
  },
  totalLikes: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总点赞数'
  },
  totalComments: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总评论数'
  },
  totalShares: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总分享数'
  },
  totalNegativeFeedbacks: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总负反馈数'
  },
  totalRecommendations: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总推荐数'
  },
  clickedRecommendations: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '点击的推荐数'
  },
  recommendationCtr: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '推荐点击率'
  }
}, {
  tableName: 'daily_active_users',
  timestamps: true,
  comment: '日活跃用户统计表'
});

const RetentionStats = sequelize.define('RetentionStats', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cohortDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '用户注册日期（分组日期）'
  },
  totalUsers: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '该分组总用户数'
  },
  day1Retention: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '次日留存率'
  },
  day3Retention: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '3日留存率'
  },
  day7Retention: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '7日留存率'
  },
  day14Retention: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '14日留存率'
  },
  day30Retention: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '30日留存率'
  },
  day1Active: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '次日活跃用户数'
  },
  day3Active: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '3日活跃用户数'
  },
  day7Active: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '7日活跃用户数'
  },
  day14Active: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '14日活跃用户数'
  },
  day30Active: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '30日活跃用户数'
  }
}, {
  tableName: 'retention_stats',
  timestamps: true,
  comment: '留存统计表'
});

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  traceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '追踪ID（全链路唯一）'
  },
  eventType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '事件类型：content_import, content_analyze, recommendation, ad_delivery, user_interaction, negative_feedback, audit, config_change等'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '用户ID'
  },
  userRole: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '用户角色'
  },
  targetType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '目标类型：content, user, ad, campaign等'
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '目标ID'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '操作描述'
  },
  beforeData: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: '操作前数据'
  },
  afterData: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: '操作后数据'
  },
  changes: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '变更字段列表'
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'pending'),
    defaultValue: 'success',
    comment: '操作状态'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息（失败时）'
  },
  requestId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '请求ID'
  },
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '会话ID'
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
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '时间戳'
  }
}, {
  tableName: 'audit_logs',
  timestamps: true,
  comment: '审计日志表（全链路追踪）'
});

const AdReconciliation = sequelize.define('AdReconciliation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  advertiserId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '广告主ID'
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '推广活动ID'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '日期'
  },
  totalImpressions: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总曝光数'
  },
  totalClicks: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '总点击数'
  },
  ctr: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '点击率'
  },
  totalCost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '总消耗金额'
  },
  avgCpc: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    comment: '平均点击成本'
  },
  avgCpm: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    comment: '平均千次曝光成本'
  },
  systemRecorded: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '系统记录数据'
  },
  advertiserReported: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '广告主上报数据'
  },
  discrepancy: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '差异数据'
  },
  status: {
    type: DataTypes.ENUM('pending', 'matched', 'discrepant', 'resolved'),
    defaultValue: 'pending',
    comment: '对账状态'
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '解决时间'
  },
  resolvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '解决人ID'
  },
  resolutionNote: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '解决说明'
  }
}, {
  tableName: 'ad_reconciliations',
  timestamps: true,
  comment: '广告对账表'
});

module.exports = {
  DailyActiveUser,
  RetentionStats,
  AuditLog,
  AdReconciliation
};
