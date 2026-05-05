const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    comment: '角色名称：admin(管理员), moderator(版主), user(普通用户), guest(游客)'
  },
  displayName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '角色显示名称'
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '角色描述'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '权限列表，存储权限代码数组'
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '角色级别，数字越大权限越高：admin=100, moderator=50, user=10, guest=0'
  }
}, {
  tableName: 'roles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});

module.exports = Role;
