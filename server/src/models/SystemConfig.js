const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class SystemConfig extends Model {}

SystemConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    group: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'general',
      comment: '配置分组'
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '配置键'
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '配置值'
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string',
      comment: '值类型'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '配置描述'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    }
  },
  {
    sequelize,
    modelName: 'SystemConfig',
    tableName: 'system_configs',
    timestamps: true,
    paranoid: true,
    comment: '系统配置表',
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['group']
      }
    ]
  }
);

module.exports = SystemConfig;
