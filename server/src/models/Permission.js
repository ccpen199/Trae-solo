const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Permission extends Model {}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '权限名称'
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '权限代码'
    },
    type: {
      type: DataTypes.ENUM('menu', 'button', 'api'),
      defaultValue: 'menu',
      comment: '权限类型：菜单、按钮、API'
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '父权限ID'
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '路由路径'
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '图标'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态'
    }
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    comment: '权限表'
  }
);

module.exports = Permission;