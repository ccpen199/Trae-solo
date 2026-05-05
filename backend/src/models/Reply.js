const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Reply extends Model {}

Reply.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'topic_id',
      references: {
        model: 'topics',
        key: 'id'
      }
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
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_id',
      references: {
        model: 'replies',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  },
  {
    sequelize,
    modelName: 'Reply',
    tableName: 'replies',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  }
);

module.exports = Reply;
