const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class TimeSlot extends Model {}

TimeSlot.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '时段名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '时段编码'
    },
    type: {
      type: DataTypes.ENUM('entry', 'catering', 'booklet', 'general'),
      defaultValue: 'general',
      comment: '时段类型：entry-入场, catering-餐饮, booklet-图册, general-通用'
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: '开始时间'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: '结束时间'
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '生效日期（为空则每天生效）'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '描述'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '状态：true-启用, false-禁用'
    }
  },
  {
    sequelize,
    modelName: 'TimeSlot',
    tableName: 'time_slots',
    timestamps: true,
    paranoid: true,
    comment: '时段设置表'
  }
);

module.exports = TimeSlot;
