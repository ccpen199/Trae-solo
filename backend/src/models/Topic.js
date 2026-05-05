const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const TOPIC_STATUSES = {
  NORMAL: 0,
  PINNED: 1,
  DRAFT: 2,
  DELETED: 3
};

class Topic extends Model {
  static STATUSES = TOPIC_STATUSES;
}

Topic.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
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
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: TOPIC_STATUSES.NORMAL
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'view_count'
    },
    replyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'reply_count'
    },
    lastReplyAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_reply_at'
    },
    lastReplyUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'last_reply_user_id'
    }
  },
  {
    sequelize,
    modelName: 'Topic',
    tableName: 'topics',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  }
);

module.exports = Topic;
