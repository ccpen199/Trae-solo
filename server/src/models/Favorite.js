const { DataTypes, Model, Op } = require('sequelize');
const sequelize = require('../config/database');

class Favorite extends Model {}

Favorite.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'resources',
        key: 'id',
      },
    },
    groupPostId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'group_posts',
        key: 'id',
      },
    },
    favoriteType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'resource',
      validate: {
        isIn: [['resource', 'post']]
      }
    },
  },
  {
    sequelize,
    modelName: 'Favorite',
    tableName: 'favorites',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'resourceId'], unique: false },
      { fields: ['userId', 'groupPostId'], unique: false },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = Favorite;
