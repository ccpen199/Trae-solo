const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SubOrder extends Model {}

SubOrder.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'orders', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('meal', 'delivery', 'payment'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      defaultValue: 'pending',
    },
    third_party_no: {
      type: DataTypes.STRING,
    },
    third_party_resp: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'SubOrder',
    tableName: 'sub_orders',
  }
);

module.exports = SubOrder;
