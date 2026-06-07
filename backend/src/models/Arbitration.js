const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Arbitration extends Model {}

Arbitration.init(
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
    initiator_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'resolved', 'rejected'),
      defaultValue: 'pending',
    },
    resolution: {
      type: DataTypes.TEXT,
    },
    handler: {
      type: DataTypes.UUID,
    },
    handle_at: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: 'Arbitration',
    tableName: 'arbitrations',
  }
);

module.exports = Arbitration;
