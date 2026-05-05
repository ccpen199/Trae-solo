const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DownloadCategory extends Model {}

DownloadCategory.init(
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
    allowed_extensions: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '允许的文件扩展名，用逗号分隔'
    },
    max_size: {
      type: DataTypes.INTEGER,
      defaultValue: 10485760,
      comment: '最大文件大小（字节）'
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
    modelName: 'DownloadCategory',
    tableName: 'download_categories',
    comment: '下载分类表'
  }
);

module.exports = DownloadCategory;