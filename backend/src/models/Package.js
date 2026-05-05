const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '套餐名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '套餐编码'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '套餐分类（如：基础包、升级包、定制包）'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '套餐描述'
  },
  basePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '基础单价（元/平方米）'
  },
  minArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '最小适用面积'
  },
  maxArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '最大适用面积'
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图URL'
  },
  images: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '套餐图片列表（JSON数组）'
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '套餐特点（JSON数组）'
  },
  includedItems: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '包含项目（JSON数组）'
  },
  excludedItems: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '不包含项目（JSON数组）'
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
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
    comment: '平均评分'
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '评论数量'
  }
}, {
  tableName: 'packages',
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['code'] },
    { fields: ['category'] },
    { fields: ['status'] }
  ]
});

const PackageAttribute = sequelize.define('PackageAttribute', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '属性名称（如：风格、材质、颜色）'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '属性编码'
  },
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'select',
    comment: '属性类型：select-单选, multiple-多选, range-区间'
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否必选'
  },
  priceImpactType: {
    type: DataTypes.STRING(20),
    defaultValue: 'none',
    comment: '价格影响类型：none-无影响, add-加价, multiply-乘数'
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
  tableName: 'package_attributes',
  timestamps: true,
  indexes: [
    { fields: ['packageId'] },
    { fields: ['code'] }
  ]
});

const PackageAttributeValue = sequelize.define('PackageAttributeValue', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  attributeId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '属性ID'
  },
  value: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '属性值'
  },
  label: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '显示名称'
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '属性值图片URL'
  },
  priceAdjustment: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '价格调整值（加价或乘数）'
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否默认选中'
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
  tableName: 'package_attribute_values',
  timestamps: true,
  indexes: [
    { fields: ['attributeId'] }
  ]
});

Package.hasMany(PackageAttribute, { foreignKey: 'packageId', as: 'attributes' });
PackageAttribute.belongsTo(Package, { foreignKey: 'packageId', as: 'package' });

PackageAttribute.hasMany(PackageAttributeValue, { foreignKey: 'attributeId', as: 'values' });
PackageAttributeValue.belongsTo(PackageAttribute, { foreignKey: 'attributeId', as: 'attribute' });

module.exports = {
  Package,
  PackageAttribute,
  PackageAttributeValue
};
