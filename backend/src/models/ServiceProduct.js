const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ServiceProduct extends Model {}

ServiceProduct.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    provider_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'service_providers', key: 'id' },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('food_delivery', 'ride_hailing', 'gov_payment', 'retail'),
      allowNull: false,
    },
    sku_code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    original_price: {
      type: DataTypes.DECIMAL(12, 2),
    },
    description: {
      type: DataTypes.TEXT,
    },
    spec: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.ENUM('on_sale', 'off_sale'),
      defaultValue: 'on_sale',
    },
  },
  {
    sequelize,
    modelName: 'ServiceProduct',
    tableName: 'service_products',
  }
);

module.exports = ServiceProduct;
