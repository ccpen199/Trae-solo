const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '分区名称'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '分区描述'
  },
  icon: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '分区图标URL'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序，数字越小越靠前'
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否显示'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  indexes: [
    {
      fields: ['sortOrder']
    }
  ]
});

module.exports = Category;
