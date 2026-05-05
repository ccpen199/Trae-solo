const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Download extends Model {}

Download.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '文件名称'
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '分类ID'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '文件描述'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '服务器文件名'
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '原始文件名'
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '文件路径'
    },
    file_size: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      comment: '文件大小（字节）'
    },
    file_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '文件类型/MIME类型'
    },
    file_extension: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '文件扩展名'
    },
    thumbnail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '缩略图'
    },
    keywords: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '关键词'
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
    download_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '下载次数'
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '浏览次数'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    },
    publish_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    }
  },
  {
    sequelize,
    modelName: 'Download',
    tableName: 'downloads',
    comment: '下载文件表'
  }
);

module.exports = Download;