const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('discount', 'fixed', 'free'),
    allowNull: false
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  discountPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  maxDiscountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  perUserLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  applicableHouseTypes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  applicableCities: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  isPartnerCoupon: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  partnerName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'expired', 'used_up'),
    defaultValue: 'active'
  }
}, {
  tableName: 'coupons',
  timestamps: true,
  indexes: [
    { fields: ['code'] },
    { fields: ['status'] },
    { fields: ['startTime'] },
    { fields: ['endTime'] }
  ]
});

module.exports = Coupon;
