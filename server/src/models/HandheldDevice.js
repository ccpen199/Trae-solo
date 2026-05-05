const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class HandheldDevice extends Model {}

HandheldDevice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    deviceId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '设备编号（唯一标识）'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '设备名称'
    },
    deviceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '设备型号'
    },
    macAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'MAC地址'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    },
    operationMode: {
      type: DataTypes.ENUM('entry', 'catering', 'booklet', 'all'),
      defaultValue: 'all',
      comment: '操作模式：entry-入场, catering-餐饮, booklet-图册, all-全部'
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '所属部门ID'
    },
    assignedUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '分配给的用户ID'
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后同步时间'
    },
    lastHeartbeatAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后心跳时间'
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '电量百分比'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'lost'),
      defaultValue: 'inactive',
      comment: '状态：active-在线, inactive-离线, maintenance-维护, lost-丢失'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '设备位置/区域'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    sequelize,
    modelName: 'HandheldDevice',
    tableName: 'handheld_devices',
    timestamps: true,
    paranoid: true,
    comment: '手持机设备表',
    indexes: [
      {
        unique: true,
        fields: ['deviceId']
      },
      {
        fields: ['status']
      }
    ]
  }
);

module.exports = HandheldDevice;
