const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Advertiser = sequelize.define('Advertiser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    comment: '关联的用户ID'
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '公司名称'
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '行业'
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '联系人'
  },
  contactPhone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '联系电话'
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '账户余额'
  },
  totalDeposit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '总充值金额'
  },
  totalCost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '总消耗金额'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'frozen'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'advertisers',
  timestamps: true,
  comment: '广告主表'
});

const AdCampaign = sequelize.define('AdCampaign', {
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
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '推广活动名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '推广活动描述'
  },
  budget: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '总预算'
  },
  dailyBudget: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '每日预算'
  },
  spentAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '已消耗金额'
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'active', 'paused', 'completed', 'rejected'),
    defaultValue: 'draft',
    comment: '活动状态'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结束时间'
  },
  targetAudience: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '目标受众配置 {ageRange, gender, interests, regions}'
  },
  bidStrategy: {
    type: DataTypes.ENUM('cpc', 'cpm', 'cpa'),
    defaultValue: 'cpc',
    comment: '出价策略：cpc-点击计费, cpm-曝光计费, cpa-转化计费'
  },
  maxBid: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    comment: '最高出价'
  },
  autoBid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否自动出价'
  }
}, {
  tableName: 'ad_campaigns',
  timestamps: true,
  comment: '广告推广活动表'
});

const AdMaterial = sequelize.define('AdMaterial', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '推广活动ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '广告标题'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '广告描述'
  },
  adType: {
    type: DataTypes.ENUM('image', 'video', 'text', 'native'),
    defaultValue: 'native',
    comment: '广告类型'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '图片URL'
  },
  videoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '视频URL'
  },
  landingUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '落地页URL'
  },
  displayPosition: {
    type: DataTypes.ENUM('feed_top', 'feed_mid', 'feed_bottom', 'banner', 'popup'),
    defaultValue: 'feed_mid',
    comment: '展示位置'
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'active', 'paused', 'rejected'),
    defaultValue: 'draft',
    comment: '素材状态'
  },
  weight: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '素材权重'
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
  totalCost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    comment: '总消耗'
  }
}, {
  tableName: 'ad_materials',
  timestamps: true,
  comment: '广告素材表'
});

const AdDelivery = sequelize.define('AdDelivery', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  deliveryId: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    comment: '分发唯一标识'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID'
  },
  materialId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '广告素材ID'
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '推广活动ID'
  },
  advertiserId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '广告主ID'
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Feed流中的位置'
  },
  displayPosition: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '展示位置类型'
  },
  bidPrice: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    comment: '出价'
  },
  matchScore: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 0,
    comment: '匹配分数'
  },
  isImpressed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否曝光'
  },
  impressedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '曝光时间'
  },
  isClicked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否点击'
  },
  clickedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '点击时间'
  },
  cost: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
    comment: '消耗金额'
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
  tableName: 'ad_deliveries',
  timestamps: true,
  comment: '广告分发记录表'
});

Advertiser.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Advertiser, { foreignKey: 'userId', as: 'advertiser' });

AdCampaign.belongsTo(Advertiser, { foreignKey: 'advertiserId', as: 'advertiser' });
Advertiser.hasMany(AdCampaign, { foreignKey: 'advertiserId', as: 'campaigns' });

AdMaterial.belongsTo(AdCampaign, { foreignKey: 'campaignId', as: 'campaign' });
AdCampaign.hasMany(AdMaterial, { foreignKey: 'campaignId', as: 'materials' });

AdDelivery.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AdDelivery.belongsTo(AdMaterial, { foreignKey: 'materialId', as: 'material' });
AdDelivery.belongsTo(AdCampaign, { foreignKey: 'campaignId', as: 'campaign' });
AdDelivery.belongsTo(Advertiser, { foreignKey: 'advertiserId', as: 'advertiser' });

module.exports = {
  Advertiser,
  AdCampaign,
  AdMaterial,
  AdDelivery
};
