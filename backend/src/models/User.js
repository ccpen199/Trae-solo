const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/sequelize');
const Role = require('./Role');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（加密存储）',
    set(value) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(value, salt);
      this.setDataValue('password', hash);
    }
  },
  realName: {
    type: DataTypes.STRING(50),
    comment: '真实姓名'
  },
  phone: {
    type: DataTypes.STRING(20),
    comment: '联系电话'
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '角色ID'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：0禁用 1启用'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    comment: '最后登录时间'
  },
  lastLoginIp: {
    type: DataTypes.STRING(50),
    comment: '最后登录IP'
  }
}, {
  tableName: 'users',
  comment: '用户表',
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

User.prototype.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId' });

module.exports = User;
