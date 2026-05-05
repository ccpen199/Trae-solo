const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Channel = sequelize.define('Channel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'original',
    allowNull: false,
    validate: {
      isIn: [['original', 'recommend', 'topic', 'library']]
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']]
    }
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  contentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isHot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'channels',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['isFeatured'] },
    { fields: ['isHot'] }
  ]
});

module.exports = Channel;
