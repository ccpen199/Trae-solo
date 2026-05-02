import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shop_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shops',
      key: 'id'
    }
  },
  platform_order_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  platform: {
    type: DataTypes.ENUM('amazon', 'ebay', 'shopify', 'tiktok'),
    allowNull: false
  },
  customer_info: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  payment_status: {
    type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
    defaultValue: 'unpaid'
  },
  shipping_status: {
    type: DataTypes.ENUM('unshipped', 'shipped'),
    defaultValue: 'unshipped'
  },
  sync_status: {
    type: DataTypes.ENUM('synced', 'pending', 'error'),
    defaultValue: 'pending'
  },
  merge_order_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  processing_chain: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  platform_created_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true
});

export default Order;