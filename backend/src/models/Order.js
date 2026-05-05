const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Table = require('./Table');
const User = require('./User');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '订单号'
  },
  tableId: {
    type: DataTypes.UUID,
    comment: '桌台ID'
  },
  customerName: {
    type: DataTypes.STRING(50),
    comment: '顾客姓名'
  },
  customerPhone: {
    type: DataTypes.STRING(20),
    comment: '顾客电话'
  },
  guestCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '用餐人数'
  },
  orderType: {
    type: DataTypes.ENUM,
    values: ['dine_in', 'takeout', 'delivery'],
    defaultValue: 'dine_in',
    comment: '订单类型：dine_in堂食 takeout外卖 delivery配送'
  },
  status: {
    type: DataTypes.ENUM,
    values: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled', 'refunded'],
    defaultValue: 'pending',
    comment: '订单状态'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '总金额'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '优惠金额'
  },
  payAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '实付金额'
  },
  payMethod: {
    type: DataTypes.STRING(50),
    comment: '支付方式：cash, wechat, alipay, card'
  },
  paidAt: {
    type: DataTypes.DATE,
    comment: '支付时间'
  },
  paymentId: {
    type: DataTypes.UUID,
    comment: '支付记录ID'
  },
  waiterId: {
    type: DataTypes.UUID,
    comment: '服务员ID'
  },
  cashierId: {
    type: DataTypes.UUID,
    comment: '收银员ID'
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注'
  },
  source: {
    type: DataTypes.STRING(50),
    defaultValue: 'pos',
    comment: '订单来源：pos前台, online线上, phone电话'
  }
}, {
  tableName: 'orders',
  comment: '订单表',
  indexes: [
    { fields: ['orderNo'] },
    { fields: ['tableId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

Order.belongsTo(Table, { foreignKey: 'tableId', as: 'table' });
Order.belongsTo(User, { foreignKey: 'waiterId', as: 'waiter' });
Order.belongsTo(User, { foreignKey: 'cashierId', as: 'cashier' });
Table.hasMany(Order, { foreignKey: 'tableId' });

module.exports = Order;
