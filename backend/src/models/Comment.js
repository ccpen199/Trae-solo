const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  sourceType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['book', 'channel', 'post', 'weibo', 'library']]
    }
  },
  sourceId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  },
  replyToId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  replyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'deleted', 'blocked']]
    }
  },
  isTop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  weiboSourceId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  weiboSourceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  weiboSourceUser: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'comments',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['sourceType', 'sourceId'] },
    { fields: ['userId'] },
    { fields: ['parentId'] },
    { fields: ['status'] },
    { fields: ['isTop'] },
    { fields: ['isFeatured'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Comment;
