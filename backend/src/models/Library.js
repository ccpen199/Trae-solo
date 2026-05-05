const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Library = sequelize.define('Library', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  slug: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'public',
    validate: {
      isIn: [['university', 'public', 'private', 'digital']]
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
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  province: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: '中国'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  openingHours: {
    type: DataTypes.JSON,
    allowNull: true
  },
  facilities: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  bookCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']]
    }
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isHot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'libraries',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['name'] },
    { fields: ['city'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['isFeatured'] },
    { fields: ['isHot'] },
    { fields: ['rating'] }
  ]
});

module.exports = Library;
