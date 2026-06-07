const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ServiceProvider extends Model {}

ServiceProvider.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    license_no: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('food_delivery', 'ride_hailing', 'gov_payment', 'retail'),
      allowNull: false,
    },
    category_detail: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'disabled'),
      defaultValue: 'pending',
    },
    settlement_cycle: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      defaultValue: 'monthly',
    },
    contact_name: {
      type: DataTypes.STRING,
    },
    contact_phone: {
      type: DataTypes.STRING,
    },
    remark: {
      type: DataTypes.TEXT,
    },
    audit_by: {
      type: DataTypes.UUID,
    },
    audit_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'ServiceProvider',
    tableName: 'service_providers',
  }
);

module.exports = ServiceProvider;
