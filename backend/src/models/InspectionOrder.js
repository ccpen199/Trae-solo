const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InspectionOrder = sequelize.define('InspectionOrder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNo: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: '核查单编号',
  },
  violationEventId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '关联超标事件ID',
  },
  enterpriseId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '企业ID',
  },
  regulatorId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '指派监管员ID',
  },
  status: {
    type: DataTypes.ENUM(
      'pending_assign',
      'pending_inspect',
      'inspected',
      'closed'
    ),
    defaultValue: 'pending_assign',
    comment: '状态: pending_assign=待指派, pending_inspect=待核查, inspected=已核查, closed=已关闭',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    comment: '优先级',
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '指派时间',
  },
  inspectionDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '核查截止时间',
  },
  inspectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '核查时间',
  },
  inspectionContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '现场核查内容(整改文书)',
  },
  rectificationRequirements: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '整改要求(JSON数组)',
    get() {
      const raw = this.getDataValue('rectificationRequirements');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('rectificationRequirements', JSON.stringify(val));
    },
  },
  rectificationDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '整改截止时间',
  },
  auditFlow: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核流水(JSON数组，记录审核轨迹)',
    get() {
      const raw = this.getDataValue('auditFlow');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('auditFlow', JSON.stringify(val));
    },
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '关闭时间',
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
  tableName: 'inspection_orders',
  comment: '核查单表',
});

InspectionOrder.associate = (models) => {
  InspectionOrder.belongsTo(models.ViolationEvent, {
    foreignKey: 'violationEventId',
    as: 'violationEvent',
  });
  InspectionOrder.belongsTo(models.Enterprise, {
    foreignKey: 'enterpriseId',
    as: 'enterprise',
  });
  InspectionOrder.belongsTo(models.User, {
    foreignKey: 'regulatorId',
    as: 'regulator',
  });
};

module.exports = InspectionOrder;
