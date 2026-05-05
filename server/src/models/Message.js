const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Message extends Model {}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '留言分类ID'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '用户ID（已登录用户）'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '姓名'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '电话'
    },
    company: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '公司名称'
    },
    subject: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '主题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '留言内容'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已读'
    },
    is_replied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已回复'
    },
    reply_content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '回复内容'
    },
    reply_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '回复时间'
    },
    reply_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '回复管理员ID'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processed', 'closed'),
      defaultValue: 'pending',
      comment: '状态：待处理、已处理、已关闭'
    }
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    comment: '留言表'
  }
);

module.exports = Message;