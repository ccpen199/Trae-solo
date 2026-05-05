const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Demand = sequelize.define('Demand', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  demandNo: {
    type: DataTypes.STRING(32),
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  checkInDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  checkOutDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  nights: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  maxGuests: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  houseType: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  minPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  maxPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  rooms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bedrooms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  bathrooms: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  amenities: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  specialRequirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isUrgent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'matched', 'booked', 'expired', 'closed'),
    defaultValue: 'published'
  },
  matchedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  contactedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'demands',
  timestamps: true,
  indexes: [
    { fields: ['demandNo'] },
    { fields: ['userId'] },
    { fields: ['city'] },
    { fields: ['status'] },
    { fields: ['checkInDate'] }
  ]
});

module.exports = Demand;
