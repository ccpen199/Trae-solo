const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '内容标题'
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '内容摘要'
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: '正文内容'
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '内容来源'
  },
  sourceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '来源链接'
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图片URL'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '分类ID'
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '作者'
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_analysis', 'analyzing', 'to_recommend', 'published', 'archived', 'rejected'),
    defaultValue: 'draft',
    comment: '状态：draft-草稿, pending_analysis-待分析, analyzing-分析中, to_recommend-待推荐, published-已发布, archived-已归档, rejected-已拒绝'
  },
  weightTags: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '权重标签数组'
  },
  semanticTags: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '语义标签数组（自动分析）'
  },
  categoryTags: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '分类标签数组（自动分类）'
  },
  keywords: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '关键词数组'
  },
  contentHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '内容哈希（用于去重）'
  },
  isDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否重复内容'
  },
  originalContentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '原始内容ID（重复内容指向）'
  },
  publishTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '发布时间'
  },
  viewCount: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '浏览量'
  },
  likeCount: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '点赞数'
  },
  commentCount: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '评论数'
  },
  shareCount: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '分享数'
  },
  hotScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '热度分数'
  },
  recommendationWeight: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1.0,
    comment: '推荐权重'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '创建者ID'
  }
}, {
  tableName: 'contents',
  timestamps: true,
  paranoid: true,
  comment: '内容表'
});

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '分类名称'
  },
  code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: '分类编码'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '父分类ID'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '图标'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  comment: '内容分类表'
});

const WeightTag = sequelize.define('WeightTag', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '标签名称'
  },
  code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
    comment: '标签编码'
  },
  weightValue: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.0,
    comment: '权重值'
  },
  category: {
    type: DataTypes.ENUM('quality', 'timeliness', 'hot', 'custom'),
    defaultValue: 'custom',
    comment: '标签分类'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '描述'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    comment: '状态'
  }
}, {
  tableName: 'weight_tags',
  timestamps: true,
  comment: '权重标签表'
});

Content.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Content.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Category.hasMany(Content, { foreignKey: 'categoryId', as: 'contents' });

module.exports = {
  Content,
  Category,
  WeightTag
};
