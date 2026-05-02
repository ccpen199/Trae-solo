import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('inventory', 'shipping', 'order', 'system'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('info', 'warning', 'error'),
    defaultValue: 'warning'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'resolved'),
    defaultValue: 'pending'
  },
  related_type: {
    type: DataTypes.ENUM('order', 'product', 'sku'),
    allowNull: true
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'alerts',
  timestamps: true
});

export default Alert;