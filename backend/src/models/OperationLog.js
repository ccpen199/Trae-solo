const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class OperationLog extends Model {}

OperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    targetType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'target_type'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'target_id'
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'user_agent'
    }
  },
  {
    sequelize,
    modelName: 'OperationLog',
    tableName: 'operation_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

module.exports = OperationLog;
