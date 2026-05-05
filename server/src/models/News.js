const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class News extends Model {}

News.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '新闻标题'
    },
    subtitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '副标题'
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '分类ID'
    },
    summary: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '摘要'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '内容'
    },
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图'
    },
    author: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '作者'
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '来源'
    },
    keywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '关键词'
    },
    is_top: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否置顶'
    },
    is_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否推荐'
    },
    is_hot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否热门'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '浏览次数'
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
      comment: '状态：草稿、已发布、已归档'
    },
    publish_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    }
  },
  {
    sequelize,
    modelName: 'News',
    tableName: 'news',
    comment: '新闻表'
  }
);

module.exports = News;