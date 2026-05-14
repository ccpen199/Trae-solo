const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  targetType: {
    type: DataTypes.ENUM('article', 'question'),
    allowNull: false
  },
  targetId: {
    type: DataTypes.UUID,
    allowNull: false
  }
});

module.exports = Favorite;
