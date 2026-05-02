const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RectificationRecord = sequelize.define('RectificationRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  violationEventId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '超标事件ID',
  },
  inspectionOrderId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '核查单ID',
  },
  enterpriseId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '企业ID',
  },
  status: {
    type: DataTypes.ENUM('pending_submit', 'pending_review', 'approved', 'rejected'),
    defaultValue: 'pending_submit',
    comment: '状态: pending_submit=待提交, pending_review=待审核, approved=已通过, rejected=已驳回',
  },
  submittedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '提交人ID',
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '提交时间',
  },
  rectificationContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '整改内容说明',
  },
  rectificationMeasures: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '整改措施(JSON数组)',
    get() {
      const raw = this.getDataValue('rectificationMeasures');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('rectificationMeasures', JSON.stringify(val));
    },
  },
  proofMaterials: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '证明材料(JSON数组，包含文件路径、名称等)',
    get() {
      const raw = this.getDataValue('proofMaterials');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('proofMaterials', JSON.stringify(val));
    },
  },
  reviewComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核意见',
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '审核人ID',
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间',
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
  tableName: 'rectification_records',
  comment: '整改记录表',
});

RectificationRecord.associate = (models) => {
  RectificationRecord.belongsTo(models.ViolationEvent, {
    foreignKey: 'violationEventId',
    as: 'violationEvent',
  });
  RectificationRecord.belongsTo(models.InspectionOrder, {
    foreignKey: 'inspectionOrderId',
    as: 'inspectionOrder',
  });
  RectificationRecord.belongsTo(models.Enterprise, {
    foreignKey: 'enterpriseId',
    as: 'enterprise',
  });
};

module.exports = RectificationRecord;
