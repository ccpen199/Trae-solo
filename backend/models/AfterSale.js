import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const AfterSale = sequelize.define('AfterSale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('refund', 'return', 'dispute'),
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'rejected'),
    defaultValue: 'pending'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  platform_after_sale_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  processing_chain: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'after_sales',
  timestamps: true
});

export default AfterSale;