const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const POST_TYPES = {
  DISCUSSION: 'discussion',
  QUESTION: 'question',
  EXPERIENCE: 'experience',
  EMOTION: 'emotion',
  KNOWLEDGE: 'knowledge'
};

const POST_CATEGORIES = {
  PREGNANCY: 'pregnancy',
  PREPARING: 'preparing',
  PARENTING: 'parenting',
  HEALTH: 'health',
  EMOTION: 'emotion',
  DIET: 'diet',
  ACTIVITY: 'activity'
};

class Post extends Model {
  static getPostTypes() {
    return POST_TYPES;
  }

  static getCategories() {
    return POST_CATEGORIES;
  }
}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    postType: {
      type: DataTypes.ENUM(...Object.values(POST_TYPES)),
      allowNull: false,
      defaultValue: POST_TYPES.DISCUSSION,
      field: 'post_type'
    },
    category: {
      type: DataTypes.ENUM(...Object.values(POST_CATEGORIES)),
      allowNull: false,
      defaultValue: POST_CATEGORIES.PREGNANCY
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING(50)),
      allowNull: true,
      defaultValue: []
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING(500)),
      allowNull: true,
      defaultValue: []
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'view_count'
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'like_count'
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'comment_count'
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'share_count'
    },
    isTop: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_top'
    },
    isEssence: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_essence'
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_anonymous'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'hidden', 'deleted'),
      defaultValue: 'published',
      allowNull: false
    },
    lastCommentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_comment_at'
    }
  },
  {
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['post_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

module.exports = Post;
