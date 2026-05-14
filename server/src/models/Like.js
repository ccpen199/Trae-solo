const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  targetType: {
    type: DataTypes.ENUM('article', 'question', 'answer', 'comment'),
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

module.exports = Like;
