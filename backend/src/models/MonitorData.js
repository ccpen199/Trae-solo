const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonitorData = sequelize.define('MonitorData', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  monitorPointId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '监测点ID',
  },
  rawData: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '原始传感器报文(JSON)',
    get() {
      const raw = this.getDataValue('rawData');
      return raw ? JSON.parse(raw) : {};
    },
    set(val) {
      this.setDataValue('rawData', JSON.stringify(val));
    },
  },
  dataTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '数据采集时间',
  },
  receivedTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '系统接收时间',
  },
  isAnomaly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否异常数据',
  },
  anomalyReason: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '异常原因',
  },
  sensorId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '传感器ID',
  },
  signalStrength: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '信号强度',
  },
  batteryLevel: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '电池电量',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    readOnly: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    readOnly: true,
  },
}, {
  tableName: 'monitor_data',
  comment: '传感器原始数据表(不可修改)',
  indexes: [
    {
      name: 'idx_monitor_data_point_time',
      fields: ['monitor_point_id', 'data_time'],
    },
  ],
});

MonitorData.associate = (models) => {
  MonitorData.belongsTo(models.MonitorPoint, {
    foreignKey: 'monitorPointId',
    as: 'monitorPoint',
  });
};

MonitorData.beforeUpdate(() => {
  throw new Error('原始监测数据不可修改');
});

module.exports = MonitorData;
