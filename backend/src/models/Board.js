const { DataTypes, Model } = require('sequelize');

let BoardModel = null;

const initBoard = (sequelize) => {
  if (BoardModel) return BoardModel;

  class Board extends Model {}

  Board.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100]
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'parent_id'
      },
      sort: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      topicCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'topic_count'
      }
    },
    {
      sequelize,
      modelName: 'Board',
      tableName: 'boards',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  BoardModel = Board;
  return Board;
};

const getBoard = () => {
  if (!BoardModel) {
    throw new Error('Board model not initialized. Call initBoard() first.');
  }
  return BoardModel;
};

module.exports = {
  initBoard,
  getBoard
};
