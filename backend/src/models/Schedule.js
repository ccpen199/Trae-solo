const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Schedule extends Model {}

Schedule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '日程标题'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '日程描述'
    },
    type: {
      type: DataTypes.ENUM('personal', 'department', 'meeting'),
      defaultValue: 'personal',
      comment: '类型：个人日程、部门日程、会议'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
      comment: '开始时间'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
      comment: '结束时间'
    },
    isAllDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_all_day',
      comment: '是否全天'
    },
    location: {
      type: DataTypes.STRING(200),
      comment: '地点'
    },
    reminder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '提醒时间（分钟）'
    },
    color: {
      type: DataTypes.STRING(20),
      defaultValue: '#409EFF',
      comment: '日程颜色'
    },
    recurrenceType: {
      type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly', 'yearly'),
      defaultValue: 'none',
      field: 'recurrence_type',
      comment: '重复类型'
    },
    recurrenceRule: {
      type: DataTypes.JSON,
      field: 'recurrence_rule',
      comment: '重复规则'
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      defaultValue: 'pending',
      comment: '状态：待确认、已确认、已取消、已完成'
    },
    visibility: {
      type: DataTypes.ENUM('private', 'public', 'department'),
      defaultValue: 'private',
      comment: '可见性：私有、公开、部门可见'
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'creator_id',
      comment: '创建人ID'
    },
    orgId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'org_id',
      comment: '所属机构ID'
    }
  },
  {
    sequelize,
    modelName: 'Schedule',
    tableName: 'schedules',
    timestamps: true,
    paranoid: true,
    underscored: true
  }
);

module.exports = Schedule;
