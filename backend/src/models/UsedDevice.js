const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UsedDevice = sequelize.define('UsedDevice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  device_model: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  imei: {
    type: DataTypes.STRING(15),
    unique: true
  },
  purchase_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  appearance_rating: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  ocr_report: {
    type: DataTypes.TEXT
  },
  valuation_params: {
    type: DataTypes.TEXT
  },
  refurbishment_log: {
    type: DataTypes.TEXT
  },
  estimated_value: {
    type: DataTypes.DECIMAL(10, 2)
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'used_devices'
});

module.exports = UsedDevice;
