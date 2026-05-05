const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

const KNOWLEDGE_CATEGORIES = {
  PREGNANCY: 'pregnancy',
  PREPARING: 'preparing',
  PARENTING: 'parenting',
  HEALTH: 'health',
  DIET: 'diet',
  EMOTION: 'emotion',
  MEDICAL: 'medical'
};

class Knowledge extends Model {
  static getCategories() {
    return KNOWLEDGE_CATEGORIES;
  }
}

Knowledge.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    summary: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(...Object.values(KNOWLEDGE_CATEGORIES)),
      allowNull: false,
      defaultValue: KNOWLEDGE_CATEGORIES.PREGNANCY
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING(50)),
      allowNull: true,
      defaultValue: []
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'cover_image'
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
    collectCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'collect_count'
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'share_count'
    },
    isRecommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recommended'
    },
    isEssence: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_essence'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'sort_order'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'hidden', 'deleted'),
      defaultValue: 'published',
      allowNull: false
    },
    author: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '作者/专家名称'
    },
    source: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '来源'
    }
  },
  {
    sequelize,
    modelName: 'Knowledge',
    tableName: 'knowledge',
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['is_recommended']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

module.exports = Knowledge;
