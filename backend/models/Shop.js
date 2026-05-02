import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Shop = sequelize.define('Shop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  platform: {
    type: DataTypes.ENUM('amazon', 'ebay', 'shopify', 'tiktok'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'pending'
  },
  auth_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shop_config: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'shops',
  timestamps: true
});

export default Shop;