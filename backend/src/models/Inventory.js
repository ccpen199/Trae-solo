const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '库存名称'
  },
  code: {
    type: DataTypes.STRING(50),
    comment: '编码'
  },
  type: {
    type: DataTypes.ENUM,
    values: ['dish', 'material'],
    defaultValue: 'material',
    comment: '类型：dish菜品 material原材料'
  },
  category: {
    type: DataTypes.STRING(50),
    comment: '分类'
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: '份',
    comment: '单位'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '当前库存数量'
  },
  minQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最低库存预警'
  },
  maxQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 9999,
    comment: '最高库存'
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '成本单价'
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '总库存成本'
  },
  dishId: {
    type: DataTypes.UUID,
    comment: '关联菜品ID（如果是菜品库存）'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：0禁用 1启用'
  },
  lastCheckTime: {
    type: DataTypes.DATE,
    comment: '最后盘点时间'
  }
}, {
  tableName: 'inventories',
  comment: '库存表'
});

module.exports = Inventory;
