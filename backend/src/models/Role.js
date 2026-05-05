const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色名称：admin, waiter, manager, cashier'
  },
  displayName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '显示名称'
  },
  description: {
    type: DataTypes.STRING(200),
    comment: '角色描述'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '权限列表'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：0禁用 1启用'
  }
}, {
  tableName: 'roles',
  comment: '角色表'
});

module.exports = Role;
