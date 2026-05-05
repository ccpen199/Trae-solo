const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Role extends Model {}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色代码'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '角色描述'
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否系统内置角色'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    }
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    comment: '角色表'
  }
);

module.exports = Role;