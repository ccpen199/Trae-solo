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
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '权限名称'
    },
    code: {
      type: DataTypes.STRING(100),
      unique: true,
      comment: '权限编码'
    },
    type: {
      type: DataTypes.ENUM('menu', 'button', 'api'),
      defaultValue: 'menu',
      comment: '类型：菜单、按钮、API'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      comment: '上级权限ID'
    },
    path: {
      type: DataTypes.STRING(255),
      comment: '路由路径'
    },
    icon: {
      type: DataTypes.STRING(100),
      comment: '图标'
    },
    component: {
      type: DataTypes.STRING(255),
      comment: '组件路径'
    },
    method: {
      type: DataTypes.STRING(20),
      comment: 'HTTP方法'
    },
    apiPath: {
      type: DataTypes.STRING(255),
      field: 'api_path',
      comment: 'API路径'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态：启用、停用'
    }
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    paranoid: true,
    underscored: true
  }
);

Permission.belongsTo(Permission, { 
  as: 'parent', 
  foreignKey: 'parentId',
  onDelete: 'CASCADE'
});

Permission.hasMany(Permission, { 
  as: 'children', 
  foreignKey: 'parentId'
});

module.exports = Permission;
