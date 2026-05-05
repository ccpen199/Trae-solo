const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Board = sequelize.define('Board', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '版块名称'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '版块描述'
  },
  icon: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '版块图标URL'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '所属分区ID'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '父版块ID，用于子版块'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否公开版块，非公开版块需要权限访问'
  },
  topicCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '主题数量'
  },
  replyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '回复数量'
  },
  lastTopicId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '最后发表的主题ID'
  },
  lastTopicTitle: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '最后发表的主题标题'
  },
  lastTopicUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '最后发表主题的用户ID'
  },
  lastTopicUsername: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最后发表主题的用户名'
  },
  lastReplyAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后回复时间'
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否显示'
  }
}, {
  tableName: 'boards',
  timestamps: true,
  indexes: [
    {
      fields: ['categoryId']
    },
    {
      fields: ['parentId']
    },
    {
      fields: ['sortOrder']
    }
  ]
});

module.exports = Board;
