const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
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
    comment: '订单编号'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID'
  },
  status: {
    type: DataTypes.STRING(30),
    defaultValue: 'pending',
    comment: '订单状态：pending-待确认, confirmed-已确认, paid-已付款, producing-生产中, shipping-配送中, delivered-已送达, installed-已安装, completed-已完成, cancelled-已取消, refunded-已退款'
  },
  packageId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '套餐ID'
  },
  packageName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '套餐名称（快照）'
  },
  packageCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '套餐编码（快照）'
  },
  selectedAttributes: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '选择的套餐属性（JSON对象）'
  },
  houseArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '房屋面积'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '城市'
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '区域'
  },
  project: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '项目名称'
  },
  building: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '楼栋'
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '楼层'
  },
  houseType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '户型'
  },
  floorPlanUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '平面效果图URL'
  },
  contactName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '联系人姓名'
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '联系电话'
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '详细地址'
  },
  packagePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '套餐总价'
  },
  packageUnitPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '套餐单价（含属性加价）'
  },
  upgradePrice: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '优化改造包总价'
  },
  accessoryPrice: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '配件总价'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '优惠金额'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '订单总价'
  },
  paidAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '已支付金额'
  },
  paymentMethod: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: '支付方式'
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '支付时间'
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '确认时间'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '取消时间'
  },
  cancelReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '取消原因'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  contractGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '合同是否已生成'
  },
  contractPdfUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '合同PDF地址'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['orderNo'] },
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

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
  itemType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '商品类型：package-套餐, accessory-配件, upgrade-优化改造包'
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '商品ID'
  },
  itemName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '商品名称'
  },
  itemCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '商品编码'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '商品图片'
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '数量'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: '单价'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    comment: '小计'
  },
  houseArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '房屋面积（套餐/改造包专用）'
  },
  selectedAttributes: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '选择的属性'
  },
  specs: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '规格参数'
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '单位'
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  indexes: [
    { fields: ['orderId'] },
    { fields: ['itemType', 'itemId'] }
  ]
});

const OrderStatusLog = sequelize.define('OrderStatusLog', {
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
  fromStatus: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: '原状态'
  },
  toStatus: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '新状态'
  },
  operatorType: {
    type: DataTypes.STRING(20),
    defaultValue: 'user',
    comment: '操作人类型：user-用户, admin-管理员, system-系统'
  },
  operatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '操作人ID'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'order_status_logs',
  timestamps: true,
  indexes: [
    { fields: ['orderId'] }
  ]
});

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
Order.hasMany(OrderStatusLog, { foreignKey: 'orderId', as: 'statusLogs' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderStatusLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.generateOrderNo = async function() {
  const date = new Date();
  const prefix = 'ORD' + date.getFullYear() + 
    String(date.getMonth() + 1).padStart(2, '0') + 
    String(date.getDate()).padStart(2, '0');
  
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const orderNo = prefix + random;
  
  const existing = await Order.findOne({ where: { orderNo } });
  if (existing) {
    return Order.generateOrderNo();
  }
  
  return orderNo;
};

module.exports = {
  Order,
  OrderItem,
  OrderStatusLog
};
