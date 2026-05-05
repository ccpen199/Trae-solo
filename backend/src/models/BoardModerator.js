const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class BoardModerator extends Model {}

BoardModerator.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    boardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'board_id',
      references: {
        model: 'boards',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'BoardModerator',
    tableName: 'board_moderators',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = BoardModerator;
