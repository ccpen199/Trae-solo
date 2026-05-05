const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class GroupPost extends Model {}

GroupPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('images');
        try {
          return value ? JSON.parse(value) : [];
        } catch {
          return [];
        }
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('images', JSON.stringify(value));
        } else if (typeof value === 'string') {
          this.setDataValue('images', value);
        } else {
          this.setDataValue('images', null);
        }
      },
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isTop: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isHighlight: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'published',
      allowNull: false,
      validate: {
        isIn: [['draft', 'published', 'hidden', 'rejected']]
      }
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastReplyAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'GroupPost',
    tableName: 'group_posts',
    timestamps: true,
    indexes: [
      { fields: ['groupId'] },
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['isTop'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = GroupPost;
