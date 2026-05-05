const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Order = require('./Order');
const Dish = require('./Dish');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '订单ID'
  },
  dishId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '菜品ID'
  },
  dishName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '菜品名称（快照）'
  },
  dishCode: {
    type: DataTypes.STRING(50),
    comment: '菜品编码（快照）'
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: '份',
    comment: '单位'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '单价（快照）'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '数量'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '小计'
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '优惠金额'
  },
  actualAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '实际金额'
  },
  status: {
    type: DataTypes.ENUM,
    values: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled', 'refunded'],
    defaultValue: 'pending',
    comment: '明细状态'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注（如：少辣、不要葱等）'
  },
  ingredients: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '选择的配料'
  },
  servedAt: {
    type: DataTypes.DATE,
    comment: '上菜时间'
  },
  serverId: {
    type: DataTypes.UUID,
    comment: '上菜人ID'
  }
}, {
  tableName: 'order_items',
  comment: '订单明细表'
});

OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderItem.belongsTo(Dish, { foreignKey: 'dishId', as: 'dish' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });

module.exports = OrderItem;
