const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '操作类型',
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '所属模块',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '操作用户ID',
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '操作用户名称',
  },
  userRole: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '操作用户角色',
  },
  resourceType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '资源类型',
  },
  resourceId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '资源ID',
  },
  oldValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更前值(JSON)',
    get() {
      const raw = this.getDataValue('oldValue');
      return raw ? JSON.parse(raw) : null;
    },
    set(val) {
      this.setDataValue('oldValue', val ? JSON.stringify(val) : null);
    },
  },
  newValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更后值(JSON)',
    get() {
      const raw = this.getDataValue('newValue');
      return raw ? JSON.parse(raw) : null;
    },
    set(val) {
      this.setDataValue('newValue', val ? JSON.stringify(val) : null);
    },
  },
  requestIp: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '请求IP',
  },
  requestPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '请求路径',
  },
  requestMethod: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '请求方法',
  },
  requestParams: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '请求参数(JSON)',
    get() {
      const raw = this.getDataValue('requestParams');
      return raw ? JSON.parse(raw) : null;
    },
    set(val) {
      this.setDataValue('requestParams', val ? JSON.stringify(val) : null);
    },
  },
  status: {
    type: DataTypes.ENUM('success', 'failed'),
    allowNull: false,
    comment: '操作结果',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息',
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
  tableName: 'audit_logs',
  comment: '审计日志表(所有操作不可修改)',
  timestamps: true,
  indexes: [
    {
      name: 'idx_audit_log_action',
      fields: ['action'],
    },
    {
      name: 'idx_audit_log_user',
      fields: ['user_id'],
    },
    {
      name: 'idx_audit_log_resource',
      fields: ['resource_type', 'resource_id'],
    },
    {
      name: 'idx_audit_log_created',
      fields: ['created_at'],
    },
  ],
});

AuditLog.beforeUpdate(() => {
  throw new Error('审计日志不可修改');
});

AuditLog.beforeDestroy(() => {
  throw new Error('审计日志不可删除');
});

module.exports = AuditLog;
