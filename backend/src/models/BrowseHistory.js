const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BrowseHistory = sequelize.define('BrowseHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  houseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'houses',
      key: 'id'
    }
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'browse_histories',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'houseId'], unique: true },
    { fields: ['userId'] },
    { fields: ['houseId'] }
  ]
});

module.exports = BrowseHistory;
