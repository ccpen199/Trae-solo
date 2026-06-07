const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EngineerSkill = sequelize.define('EngineerSkill', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  engineer_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fault_code: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  proficiency: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  certified_at: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'engineer_skills'
});

module.exports = EngineerSkill;
