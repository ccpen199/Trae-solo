const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Fault = sequelize.define('Fault', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  device_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  symptoms: {
    type: DataTypes.TEXT
  },
  estimated_hours: {
    type: DataTypes.DECIMAL(4, 1),
    defaultValue: 1.0
  },
  estimated_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  solution: {
    type: DataTypes.TEXT
  },
  difficulty: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  }
}, {
  tableName: 'faults'
});

module.exports = Fault;
