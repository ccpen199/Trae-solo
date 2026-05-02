const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '接收用户ID(可为空，表示全员通知)',
  },
  enterpriseId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '企业ID(用于企业全员通知)',
  },
  type: {
    type: DataTypes.ENUM(
      'violation_alarm',
      'self_inspection_notice',
      'inspection_order',
      'rectification_required',
      'rectification_review',
      'compliance_confirm',
      'system_notice'
    ),
    allowNull: false,
    comment: '通知类型',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '通知标题',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '通知内容',
  },
  relatedId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '关联业务ID(事件ID、核查单ID等)',
  },
  relatedType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '关联类型(ViolationEvent, InspectionOrder等)',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    comment: '优先级',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已读',
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '阅读时间',
  },
  expireAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    readOnly: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    readOnly: true,
  },
}, {
  tableName: 'notifications',
  comment: '通知表',
  indexes: [
    {
      name: 'idx_notification_user_read',
      fields: ['user_id', 'is_read'],
    },
    {
      name: 'idx_notification_enterprise',
      fields: ['enterprise_id'],
    },
  ],
});

Notification.associate = (models) => {
  Notification.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  Notification.belongsTo(models.Enterprise, {
    foreignKey: 'enterpriseId',
    as: 'enterprise',
  });
};

module.exports = Notification;
