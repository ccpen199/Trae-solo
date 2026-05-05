const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '产品名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '产品编号'
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '分类ID'
    },
    series_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '系列ID'
    },
    summary: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '产品摘要'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '产品详情'
    },
    main_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '主图'
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: '产品图片列表'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '价格'
    },
    original_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '原价'
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '库存'
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '单位'
    },
    specifications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '规格参数'
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
    is_new: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否新品'
    },
    is_hot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否热销'
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
      type: DataTypes.ENUM('active', 'inactive', 'sold_out'),
      defaultValue: 'active',
      comment: '状态：上架、下架、售罄'
    },
    publish_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    }
  },
  {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
    comment: '产品表'
  }
);

module.exports = Product;