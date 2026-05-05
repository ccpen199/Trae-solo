const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define('Favorite', {
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
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'favorites',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'houseId'], unique: true },
    { fields: ['userId'] },
    { fields: ['houseId'] }
  ]
});

module.exports = Favorite;
