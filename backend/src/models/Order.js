const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_no: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true
  },
  user_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  user_phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  user_address: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  user_lat: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 31.2304
  },
  user_lng: {
    type: DataTypes.DECIMAL(10, 6),
    defaultValue: 121.4737
  },
  device_type: {
    type: DataTypes.STRING(50)
  },
  device_model: {
    type: DataTypes.STRING(100)
  },
  fault_description: {
    type: DataTypes.TEXT
  },
  predicted_faults: {
    type: DataTypes.TEXT
  },
  prediction_accuracy: {
    type: DataTypes.DECIMAL(5, 2)
  },
  actual_fault_code: {
    type: DataTypes.STRING(20)
  },
  engineer_id: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  appointment_time: {
    type: DataTypes.DATE
  },
  arrival_time: {
    type: DataTypes.DATE
  },
  complete_time: {
    type: DataTypes.DATE
  },
  part_trace_code: {
    type: DataTypes.STRING(100)
  },
  before_image_hash: {
    type: DataTypes.STRING(64)
  },
  after_image_hash: {
    type: DataTypes.STRING(64)
  },
  video_url: {
    type: DataTypes.STRING(200)
  },
  video_summary: {
    type: DataTypes.TEXT
  },
  total_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  rating: {
    type: DataTypes.INTEGER
  },
  comment: {
    type: DataTypes.TEXT
  },
  callback_status: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'orders'
});

module.exports = Order;
