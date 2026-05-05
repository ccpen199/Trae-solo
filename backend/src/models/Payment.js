const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const Order = require('./Order');
const User = require('./User');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  paymentNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '支付单号'
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '订单ID'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '应收金额'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '优惠金额'
  },
  payAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '实收金额'
  },
  payMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '支付方式：cash现金, wechat微信, alipay支付宝, card银行卡, combined组合支付'
  },
  paymentDetails: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '组合支付详情 [{method: "cash", amount: 100}, {method: "wechat", amount: 50}]'
  },
  receivedAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '收到金额（现金支付时用于找零计算）'
  },
  changeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '找零金额'
  },
  status: {
    type: DataTypes.ENUM,
    values: ['pending', 'success', 'failed', 'refunded'],
    defaultValue: 'pending',
    comment: '支付状态'
  },
  thirdPartyNo: {
    type: DataTypes.STRING(100),
    comment: '第三方支付单号'
  },
  paidAt: {
    type: DataTypes.DATE,
    comment: '支付时间'
  },
  cashierId: {
    type: DataTypes.UUID,
    comment: '收银员ID'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注'
  }
}, {
  tableName: 'payments',
  comment: '支付记录表',
  indexes: [
    { fields: ['paymentNo'] },
    { fields: ['orderId'] },
    { fields: ['status'] },
    { fields: ['paidAt'] }
  ]
});

Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Payment.belongsTo(User, { foreignKey: 'cashierId', as: 'cashier' });
Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment' });

module.exports = Payment;
