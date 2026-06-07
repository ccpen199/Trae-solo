const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class FeeConfig extends Model {}

FeeConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM('food_delivery', 'ride_hailing', 'gov_payment', 'retail'),
      allowNull: false,
    },
    provider_id: {
      type: DataTypes.UUID,
      references: { model: 'service_providers', key: 'id' },
    },
    fee_rate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      validate: { min: 0, max: 1 },
    },
    min_fee: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    max_fee: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    effective_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'FeeConfig',
    tableName: 'fee_configs',
  }
);

module.exports = FeeConfig;
