const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '分类名称'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  description: {
    type: DataTypes.STRING(200),
    comment: '描述'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：0禁用 1启用'
  },
  icon: {
    type: DataTypes.STRING(255),
    comment: '图标'
  }
}, {
  tableName: 'categories',
  comment: '菜品分类表'
});

module.exports = Category;
