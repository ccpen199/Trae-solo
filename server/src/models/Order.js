const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    orderNo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'order_no',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount',
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'paid',
        'shipped',
        'delivered',
        'cancelled',
        'refunded'
      ),
      defaultValue: 'pending',
      allowNull: false,
    },
    shippingAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'shipping_address',
    },
    shippingPhone: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'shipping_phone',
    },
    shippingName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'shipping_name',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at',
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['order_no'],
      },
    ],
  }
);

module.exports = Order;
