const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  operationType: {
    type: DataTypes.ENUM(
      'create_topic', 'update_topic', 'delete_topic',
      'create_reply', 'update_reply', 'delete_reply',
      'lock_topic', 'unlock_topic', 'top_topic', 'untop_topic', 'highlight_topic', 'unhighlight_topic',
      'ban_user', 'unban_user', 'update_user_role',
      'create_board', 'update_board', 'delete_board',
      'create_category', 'update_category', 'delete_category',
      'login', 'logout', 'register'
    ),
    allowNull: false,
    comment: '操作类型'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '操作用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作用户名'
  },
  targetType: {
    type: DataTypes.ENUM('user', 'topic', 'reply', 'board', 'category'),
    allowNull: true,
    comment: '目标对象类型'
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '目标对象ID'
  },
  targetName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '目标对象名称/标题'
  },
  detail: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '操作详情，JSON格式'
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '用户代理'
  }
}, {
  tableName: 'operation_logs',
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['operationType']
    },
    {
      fields: ['targetType', 'targetId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = OperationLog;
