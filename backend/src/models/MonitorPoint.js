const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonitorPoint = sequelize.define('MonitorPoint', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: '监测点编码',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '监测点名称',
  },
  type: {
    type: DataTypes.ENUM('air', 'water', 'noise', 'soil'),
    allowNull: false,
    comment: '监测类型：空气、水质、噪声、土壤',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
    comment: '纬度',
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
    comment: '经度',
  },
  enterpriseId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '所属企业ID(可选，公共监测点可无)',
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '地址',
  },
  indicators: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '监测指标配置(JSON数组)',
    get() {
      const raw = this.getDataValue('indicators');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('indicators', JSON.stringify(val));
    },
  },
  thresholds: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '阈值配置(JSON对象)',
    get() {
      const raw = this.getDataValue('thresholds');
      return raw ? JSON.parse(raw) : {};
    },
    set(val) {
      this.setDataValue('thresholds', JSON.stringify(val));
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
    defaultValue: 'active',
    comment: '设备状态',
  },
  lastDataTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后数据时间',
  },
  isMonitored: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否开启监测',
  },
}, {
  tableName: 'monitor_points',
  comment: '监测点表',
});

MonitorPoint.associate = (models) => {
  MonitorPoint.belongsTo(models.Enterprise, {
    foreignKey: 'enterpriseId',
    as: 'enterprise',
  });
  MonitorPoint.hasMany(models.MonitorData, {
    foreignKey: 'monitorPointId',
    as: 'monitorData',
  });
  MonitorPoint.hasMany(models.ViolationEvent, {
    foreignKey: 'monitorPointId',
    as: 'violationEvents',
  });
};

module.exports = MonitorPoint;
