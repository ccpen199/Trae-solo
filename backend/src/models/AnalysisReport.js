const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnalysisReport = sequelize.define('AnalysisReport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reportNo: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: '报告编号',
  },
  type: {
    type: DataTypes.ENUM(
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'yearly',
      'event',
      'custom'
    ),
    allowNull: false,
    comment: '报告类型',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '报告标题',
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '报告摘要',
  },
  periodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '统计周期开始',
  },
  periodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '统计周期结束',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '报告内容(JSON格式，包含所有统计数据)',
    get() {
      const raw = this.getDataValue('content');
      return raw ? JSON.parse(raw) : {};
    },
    set(val) {
      this.setDataValue('content', JSON.stringify(val));
    },
  },
  relatedEnterpriseIds: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '关联企业ID列表(JSON数组)',
    get() {
      const raw = this.getDataValue('relatedEnterpriseIds');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('relatedEnterpriseIds', JSON.stringify(val));
    },
  },
  violationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '超标事件数量',
  },
  resolvedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已解决数量',
  },
  avgComplianceRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '平均合规率',
  },
  generatedBy: {
    type: DataTypes.ENUM('system', 'user'),
    defaultValue: 'system',
    comment: '生成方式',
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '生成时间',
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
  tableName: 'analysis_reports',
  comment: '分析报告表',
});

AnalysisReport.beforeUpdate(() => {
  throw new Error('分析报告不可修改');
});

module.exports = AnalysisReport;
