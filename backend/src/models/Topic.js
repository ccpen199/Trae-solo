const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '主题标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '主题正文'
  },
  boardId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '所属版块ID'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '作者用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '作者用户名'
  },
  status: {
    type: DataTypes.ENUM('normal', 'highlight', 'top', 'locked', 'deleted'),
    defaultValue: 'normal',
    comment: '主题状态：normal(正常), highlight(精华), top(置顶), locked(锁定), deleted(删除)'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览次数'
  },
  replyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '回复数量'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数量'
  },
  lastReplyId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '最后回复ID'
  },
  lastReplyUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '最后回复用户ID'
  },
  lastReplyUsername: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最后回复用户名'
  },
  lastReplyAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后回复时间'
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
  tableName: 'topics',
  timestamps: true,
  indexes: [
    {
      fields: ['boardId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['lastReplyAt']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Topic;
