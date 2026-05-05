const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Table = sequelize.define('Table', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '桌台名称'
  },
  code: {
    type: DataTypes.STRING(20),
    comment: '桌台编码'
  },
  area: {
    type: DataTypes.STRING(50),
    comment: '区域'
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
    comment: '容纳人数'
  },
  status: {
    type: DataTypes.ENUM,
    values: ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'],
    defaultValue: 'available',
    comment: '状态：available空闲 occupied使用中 reserved预定 cleaning清扫中 maintenance维护中'
  },
  currentOrderId: {
    type: DataTypes.UUID,
    comment: '当前订单ID'
  },
  qrcode: {
    type: DataTypes.STRING(500),
    comment: '桌台二维码'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  }
}, {
  tableName: 'tables',
  comment: '桌台表'
});

module.exports = Table;
