const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ViolationEvent = sequelize.define('ViolationEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  eventNo: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: '事件编号',
  },
  monitorPointId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '监测点ID',
  },
  enterpriseId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '关联企业ID',
  },
  type: {
    type: DataTypes.ENUM('air', 'water', 'noise', 'soil'),
    allowNull: false,
    comment: '超标类型',
  },
  status: {
    type: DataTypes.ENUM(
      'pending_response',
      'waiting_inspection',
      'under_treatment',
      'under_review',
      'compliant',
      'closed'
    ),
    defaultValue: 'pending_response',
    comment: '事件状态: pending_response=待响应, waiting_inspection=待核查, under_treatment=治理中, under_review=待审核, compliant=合规, closed=已结案',
  },
  triggeredAt: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '触发时间',
  },
  responseDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '响应截止时间',
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '企业响应时间',
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '地理位置(JSON: {lat, lng, address})',
    get() {
      const raw = this.getDataValue('location');
      return raw ? JSON.parse(raw) : {};
    },
    set(val) {
      this.setDataValue('location', JSON.stringify(val));
    },
  },
  exceedIndicators: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '超标指标详情(JSON数组)',
    get() {
      const raw = this.getDataValue('exceedIndicators');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('exceedIndicators', JSON.stringify(val));
    },
  },
  maxExceedRatio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '最大超标倍数',
  },
  traceabilityResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '溯源引擎分析结果(JSON)',
    get() {
      const raw = this.getDataValue('traceabilityResult');
      return raw ? JSON.parse(raw) : null;
    },
    set(val) {
      this.setDataValue('traceabilityResult', val ? JSON.stringify(val) : null);
    },
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结案时间',
  },
  closedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '结案人ID',
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
  tableName: 'violation_events',
  comment: '超标事件表',
  indexes: [
    {
      name: 'idx_violation_event_status',
      fields: ['status'],
    },
    {
      name: 'idx_violation_event_enterprise',
      fields: ['enterprise_id'],
    },
  ],
});

ViolationEvent.associate = (models) => {
  ViolationEvent.belongsTo(models.MonitorPoint, {
    foreignKey: 'monitorPointId',
    as: 'monitorPoint',
  });
  ViolationEvent.belongsTo(models.Enterprise, {
    foreignKey: 'enterpriseId',
    as: 'enterprise',
  });
  ViolationEvent.hasOne(models.InspectionOrder, {
    foreignKey: 'violationEventId',
    as: 'inspectionOrder',
  });
  ViolationEvent.hasMany(models.RectificationRecord, {
    foreignKey: 'violationEventId',
    as: 'rectificationRecords',
  });
};

module.exports = ViolationEvent;
