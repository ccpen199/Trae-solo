const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Inventory = require('./Inventory');
const User = require('./User');

const InventoryLog = sequelize.define('InventoryLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  inventoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '库存ID'
  },
  type: {
    type: DataTypes.ENUM,
    values: ['in', 'out', 'adjust'],
    allowNull: false,
    comment: '类型：in入库 out出库 adjust调整'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '变动数量'
  },
  beforeQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '变动前数量'
  },
  afterQuantity: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '变动后数量'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '单价'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '总金额'
  },
  sourceType: {
    type: DataTypes.STRING(50),
    comment: '来源类型：order订单, purchase采购, check盘点, manual手动'
  },
  sourceId: {
    type: DataTypes.UUID,
    comment: '来源ID'
  },
  operatorId: {
    type: DataTypes.UUID,
    comment: '操作人ID'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注'
  }
}, {
  tableName: 'inventory_logs',
  comment: '库存变动记录表',
  indexes: [
    { fields: ['inventoryId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] }
  ]
});

InventoryLog.belongsTo(Inventory, { foreignKey: 'inventoryId', as: 'inventory' });
InventoryLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
Inventory.hasMany(InventoryLog, { foreignKey: 'inventoryId', as: 'logs' });

module.exports = InventoryLog;
