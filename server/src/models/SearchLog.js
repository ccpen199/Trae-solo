const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class SearchLog extends Model {}

SearchLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    keyword: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    searchType: {
      type: DataTypes.STRING(20),
      defaultValue: 'all',
      allowNull: false,
      validate: {
        isIn: [['resource', 'user', 'group', 'all']]
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resultCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'SearchLog',
    tableName: 'search_logs',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['keyword'] },
      { fields: ['searchType'] },
      { fields: ['userId'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = SearchLog;
