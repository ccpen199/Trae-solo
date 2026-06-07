const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class RiskEventLog extends Model {}

RiskEventLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      references: { model: 'orders', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      references: { model: 'users', key: 'id' },
    },
    event_type: {
      type: DataTypes.ENUM('fraud', 'abnormal_amount', 'frequency_alert', 'identity_mismatch', 'payment_timeout', 'other'),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    detail: {
      type: DataTypes.TEXT,
    },
    handled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    handle_result: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'RiskEventLog',
    tableName: 'risk_event_logs',
  }
);

module.exports = RiskEventLog;
