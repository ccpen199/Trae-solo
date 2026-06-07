const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Engineer = sequelize.define('Engineer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  id_card: {
    type: DataTypes.STRING(18),
    allowNull: false
  },
  certificate_no: {
    type: DataTypes.STRING(50)
  },
  certificate_level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  service_radius: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  success_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 95.00
  },
  equipment_id: {
    type: DataTypes.STRING(50)
  },
  lat: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 31.2304
  },
  lng: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 121.4737
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  avatar: {
    type: DataTypes.STRING(200)
  },
  total_orders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  avg_rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 4.80
  }
}, {
  tableName: 'engineers'
});

module.exports = Engineer;
