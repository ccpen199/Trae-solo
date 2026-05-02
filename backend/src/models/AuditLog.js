const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    operationType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型'
    },
    operationName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作名称'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '操作用户ID'
    },
    userRole: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '操作用户角色'
    },
    resourceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '资源类型'
    },
    resourceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '资源ID'
    },
    beforeData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作前数据（JSON）'
    },
    afterData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作后数据（JSON）'
    },
    operationDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作描述'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户代理'
    },
    operationSignature: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '操作签名，防篡改'
    },
    previousLogId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '前一条日志ID，用于链式校验'
    },
    chainHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '链式哈希，连接前后日志'
    },
    riskLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'low',
      comment: '风险等级'
    },
    riskReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '风险原因'
    },
    operationTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '操作时间'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
    indexes: [
      { fields: ['operationType'] },
      { fields: ['userId'] },
      { fields: ['resourceType', 'resourceId'] },
      { fields: ['operationTime'] },
      { fields: ['riskLevel'] },
      { fields: ['operationSignature'] }
    ]
  }
);

module.exports = AuditLog;
