const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  MOVE_IN: 'move_in',
  MOVE_OUT: 'move_out',
  LOGIN: 'login',
  LOGOUT: 'logout',
  QUERY: 'query'
};

class OperationLog extends Model {
  static async createLog(operationData) {
    return OperationLog.create({
      userId: operationData.userId,
      username: operationData.username,
      operationType: operationData.operationType,
      targetType: operationData.targetType,
      targetId: operationData.targetId,
      targetName: operationData.targetName,
      oldValue: operationData.oldValue,
      newValue: operationData.newValue,
      description: operationData.description,
      ipAddress: operationData.ipAddress
    });
  }
}

OperationLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
      comment: '操作用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作用户名'
    },
    operationType: {
      type: DataTypes.ENUM(...Object.values(OPERATION_TYPES)),
      allowNull: false,
      field: 'operation_type',
      comment: '操作类型'
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'target_type',
      comment: '操作对象类型'
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'target_id',
      comment: '操作对象ID'
    },
    targetName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'target_name',
      comment: '操作对象名称'
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'old_value',
      comment: '变更前数据（JSON格式）'
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'new_value',
      comment: '变更后数据（JSON格式）'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '操作描述'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'ip_address',
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'user_agent',
      comment: '浏览器/设备信息'
    }
  },
  {
    sequelize,
    modelName: 'OperationLog',
    tableName: 'operation_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['username'] },
      { fields: ['operation_type'] },
      { fields: ['target_id'] },
      { fields: ['created_at'] }
    ]
  }
);

module.exports = {
  OperationLog,
  OPERATION_TYPES
};
