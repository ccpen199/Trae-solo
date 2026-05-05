const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class EntryRecord extends Model {}

EntryRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    barcodeId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '条码ID'
    },
    barcodeCode: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '条码编号（冗余字段）'
    },
    barcodeName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '条码对应姓名/名称（冗余字段）'
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '部门ID'
    },
    timeSlotId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '时段ID'
    },
    deviceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '手持设备ID'
    },
    deviceCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '设备编号（冗余字段）'
    },
    operatorId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人姓名（冗余字段）'
    },
    entryType: {
      type: DataTypes.ENUM('entry', 'exit'),
      defaultValue: 'entry',
      comment: '入场类型：entry-入场, exit-出场'
    },
    isOffline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否离线采集'
    },
    offlineSyncId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '离线同步ID（用于同步校验）'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '入场地点'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    sequelize,
    modelName: 'EntryRecord',
    tableName: 'entry_records',
    timestamps: true,
    paranoid: true,
    comment: '入场记录表',
    indexes: [
      {
        fields: ['barcodeId']
      },
      {
        fields: ['barcodeCode']
      },
      {
        fields: ['departmentId']
      },
      {
        fields: ['timeSlotId']
      },
      {
        fields: ['deviceId']
      },
      {
        fields: ['createdAt']
      }
    ]
  }
);

module.exports = EntryRecord;
