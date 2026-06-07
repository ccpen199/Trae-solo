const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_no: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'service_providers', key: 'id' },
    },
    category: {
      type: DataTypes.ENUM('food_delivery', 'ride_hailing', 'gov_payment', 'retail'),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'fulfilling', 'completed', 'cancelled', 'refunded', 'disputed'),
      defaultValue: 'pending',
    },
    pay_method: {
      type: DataTypes.ENUM('wallet', 'bank_card', 'coupon', 'mixed'),
      defaultValue: 'wallet',
    },
    city: {
      type: DataTypes.STRING,
    },
    remark: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
  }
);

module.exports = Order;
