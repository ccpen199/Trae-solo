const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HouseCalendar = sequelize.define('HouseCalendar', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  houseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'houses',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'booked', 'blocked'),
    defaultValue: 'available'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    }
  }
}, {
  tableName: 'house_calendars',
  timestamps: true,
  indexes: [
    { fields: ['houseId', 'date'], unique: true },
    { fields: ['houseId'] },
    { fields: ['date'] },
    { fields: ['status'] }
  ]
});

module.exports = HouseCalendar;
