const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Draft = sequelize.define('Draft', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('question', 'article'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  tags: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  autoSavedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Draft;
