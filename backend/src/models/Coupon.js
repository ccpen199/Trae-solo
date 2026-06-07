const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Coupon extends Model {}

Coupon.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    min_spend: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    category: {
      type: DataTypes.ENUM('food_delivery', 'ride_hailing', 'gov_payment', 'retail'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('available', 'used', 'expired'),
      defaultValue: 'available',
    },
    expired_at: {
      type: DataTypes.DATE,
    },
    used_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'Coupon',
    tableName: 'coupons',
  }
);

module.exports = Coupon;
