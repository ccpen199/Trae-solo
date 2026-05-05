const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShoppingCart = sequelize.define('ShoppingCart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '用户ID'
  },
  sessionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '会话ID（未登录用户使用）'
  }
}, {
  tableName: 'shopping_carts',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['sessionId'] }
  ]
});

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cartId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '购物车ID'
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
    comment: '总价'
  },
  selectedAttributes: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '选择的套餐属性（JSON对象）'
  },
  houseArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '房屋面积（套餐专用）'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '扩展元数据（商品名称、图片等快照）'
  },
  isSelected: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否选中（用于结算时计算）'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  indexes: [
    { fields: ['cartId'] },
    { fields: ['itemType', 'itemId'] }
  ]
});

const UpgradePackage = sequelize.define('UpgradePackage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '优化改造包名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '编码'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '描述'
  },
  priceType: {
    type: DataTypes.STRING(20),
    defaultValue: 'per_area',
    comment: '价格类型：fixed-固定价, per_area-按面积'
  },
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '价格（固定价或单价）'
  },
  includedItems: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '包含项目'
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态'
  }
}, {
  tableName: 'upgrade_packages',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['code'] },
    { fields: ['status'] }
  ]
});

ShoppingCart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items' });
CartItem.belongsTo(ShoppingCart, { foreignKey: 'cartId', as: 'cart' });

module.exports = {
  ShoppingCart,
  CartItem,
  UpgradePackage
};
