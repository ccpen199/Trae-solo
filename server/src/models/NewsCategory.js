const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class NewsCategory extends Model {}

NewsCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '分类名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '分类代码'
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '父分类ID'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '分类描述'
    },
    icon: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '分类图标'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    is_show: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否显示'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    }
  },
  {
    sequelize,
    modelName: 'NewsCategory',
    tableName: 'news_categories',
    comment: '新闻分类表'
  }
);

module.exports = NewsCategory;