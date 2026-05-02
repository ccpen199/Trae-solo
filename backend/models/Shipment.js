import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Shipment = sequelize.define('Shipment', {
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
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  carrier: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'picked', 'in_transit', 'delivered', 'exception'),
    defaultValue: 'pending'
  },
  shipping_address: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  estimated_delivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_delivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  package_info: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'shipments',
  timestamps: true
});

export default Shipment;