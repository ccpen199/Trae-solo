const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Comment extends Model {}

Comment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
    },
    replyToUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'published',
      allowNull: false,
      validate: {
        isIn: [['pending', 'published', 'rejected']]
      }
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true,
    indexes: [
      { fields: ['resourceId'] },
      { fields: ['groupPostId'] },
      { fields: ['userId'] },
      { fields: ['parentId'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = Comment;
