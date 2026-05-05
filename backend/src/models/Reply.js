const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reply = sequelize.define('Reply', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '回复内容'
  },
  topicId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '所属主题ID'
  },
  boardId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '所属版块ID'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '回复用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '回复用户名'
  },
  parentReplyId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '父回复ID，用于楼中楼回复'
  },
  parentReplyUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '被回复的用户ID'
  },
  parentReplyUsername: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '被回复的用户名'
  },
  floor: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '楼层号，从1开始'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数量'
  },
  status: {
    type: DataTypes.ENUM('normal', 'deleted'),
    defaultValue: 'normal',
    comment: '回复状态：normal(正常), deleted(删除)'
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否可见（软删除标记）'
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '发布IP'
  }
}, {
  tableName: 'replies',
  timestamps: true,
  indexes: [
    {
      fields: ['topicId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['parentReplyId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Reply;
