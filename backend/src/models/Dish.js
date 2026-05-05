const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Category = require('./Category');

const Dish = sequelize.define('Dish', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '菜品名称'
  },
  code: {
    type: DataTypes.STRING(50),
    comment: '菜品编码'
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '分类ID'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '售价'
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '成本价'
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: '份',
    comment: '单位'
  },
  image: {
    type: DataTypes.STRING(500),
    comment: '图片地址'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '描述'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：0下架 1上架 2售罄'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  isRecommend: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否推荐'
  },
  isHot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否热销'
  },
  ingredients: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '配料列表'
  },
  stockId: {
    type: DataTypes.UUID,
    comment: '关联库存ID'
  }
}, {
  tableName: 'dishes',
  comment: '菜品表'
});

Dish.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Dish, { foreignKey: 'categoryId' });

module.exports = Dish;
