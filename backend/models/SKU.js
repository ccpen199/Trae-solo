import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SKU = sequelize.define('SKU', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  sku_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  attributes: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  min_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  platform_skus: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'skus',
  timestamps: true
});

export default SKU;