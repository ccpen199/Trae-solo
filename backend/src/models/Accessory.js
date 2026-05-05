const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AccessoryCategory = sequelize.define('AccessoryCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '分类名称（如：家具、家电、软装）'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '分类编码'
  },
  icon: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '分类图标URL'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：1-启用，0-禁用'
  }
}, {
  tableName: 'accessory_categories',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['code'] }
  ]
});

const Accessory = sequelize.define('Accessory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '分类ID'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '配件名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '配件编码'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '配件描述'
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '品牌'
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '型号'
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: '件',
    comment: '单位'
  },
  basePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '基础价格'
  },
  marketPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: '市场价格（原价）'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: -1,
    comment: '库存数量，-1表示无限库存'
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图URL'
  },
  images: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '配件图片列表（JSON数组）'
  },
  specs: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '规格参数（JSON对象）'
  },
  isOptional: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否可选配件（false表示必选）'
  },
  isRecommended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否推荐'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：1-上架，0-下架'
  },
  salesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '销售数量'
  }
}, {
  tableName: 'accessories',
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['code'] },
    { fields: ['categoryId'] },
    { fields: ['status'] }
  ]
});

const PackageAccessory = sequelize.define('PackageAccessory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  packageId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '套餐ID'
  },
  accessoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '配件ID'
  },
  defaultQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '默认数量'
  },
  minQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '最小数量'
  },
  maxQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 999,
    comment: '最大数量'
  },
  isIncluded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否包含在套餐内（true表示赠送，false表示可选购买）'
  },
  discountPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: '套餐优惠价（null表示使用原价）'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序顺序'
  }
}, {
  tableName: 'package_accessories',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['packageId', 'accessoryId'] },
    { fields: ['packageId'] },
    { fields: ['accessoryId'] }
  ]
});

Accessory.belongsTo(AccessoryCategory, { foreignKey: 'categoryId', as: 'category' });
AccessoryCategory.hasMany(Accessory, { foreignKey: 'categoryId', as: 'accessories' });

module.exports = {
  AccessoryCategory,
  Accessory,
  PackageAccessory
};
