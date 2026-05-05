const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Friendship extends Model {}

Friendship.init(
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
    friendId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      allowNull: false,
      validate: {
        isIn: [['pending', 'accepted', 'rejected', 'blocked']]
      }
    },
    remark: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Friendship',
    tableName: 'friendships',
    timestamps: true,
    indexes: [
      { fields: ['userId', 'friendId'], unique: true },
      { fields: ['friendId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = Friendship;
