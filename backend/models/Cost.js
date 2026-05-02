import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Cost = sequelize.define('Cost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('purchase', 'shipping', 'platform_fee', 'ad', 'other'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  related_type: {
    type: DataTypes.ENUM('order', 'product', 'sku'),
    allowNull: true
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  cost_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'costs',
  timestamps: true
});

export default Cost;