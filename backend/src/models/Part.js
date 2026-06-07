const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Part = sequelize.define('Part', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50)
  },
  compatible_models: {
    type: DataTypes.TEXT
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  is_original: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  trace_code_prefix: {
    type: DataTypes.STRING(20)
  },
  min_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  }
}, {
  tableName: 'parts'
});

module.exports = Part;
