const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class OperationLog extends Model {}

OperationLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '操作用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作用户名'
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作模块'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作动作'
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '操作目标ID'
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作目标类型'
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      comment: '操作描述'
    },
    requestMethod: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: '请求方法'
    },
    requestUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '请求URL'
    },
    requestParams: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '请求参数'
    },
    responseStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '响应状态码'
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
    deviceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '设备ID'
    }
  },
  {
    sequelize,
    modelName: 'OperationLog',
    tableName: 'operation_logs',
    timestamps: true,
    updatedAt: false,
    comment: '操作日志表',
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['module']
      },
      {
        fields: ['action']
      },
      {
        fields: ['createdAt']
      }
    ]
  }
);

module.exports = OperationLog;
