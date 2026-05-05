const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNo: {
    type: DataTypes.STRING(32),
    unique: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  landlordId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  houseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'houses',
      key: 'id'
    }
  },
  checkInDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  checkOutDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  nights: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  guests: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  pricePerNight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  cleaningFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  securityDeposit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  payableAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  couponId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'confirmed',
      'paid',
      'checking_in',
      'checked_in',
      'checking_out',
      'checked_out',
      'completed',
      'cancelling',
      'cancelled',
      'refunding',
      'refunded'
    ),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('alipay', 'wechat', 'balance'),
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledBy: {
    type: DataTypes.ENUM('user', 'landlord', 'system'),
    allowNull: true
  },
  cancelReason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refundReason: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isReviewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  specialRequests: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  guestNames: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  guestPhones: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    { fields: ['orderNo'] },
    { fields: ['userId'] },
    { fields: ['landlordId'] },
    { fields: ['houseId'] },
    { fields: ['status'] },
    { fields: ['checkInDate'] },
    { fields: ['checkOutDate'] }
  ]
});

module.exports = Order;
