const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

class User extends Model {
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }
}

User.init(
  {
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
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      },
      comment: '邮箱'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码'
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '昵称'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '头像URL'
    },
    user_type: {
      type: DataTypes.ENUM('admin', 'member', 'guest'),
      defaultValue: 'member',
      comment: '用户类型：管理员、会员、访客'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending', 'banned'),
      defaultValue: 'pending',
      comment: '状态：激活、未激活、待审核、禁用'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    last_login_ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '最后登录IP'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    comment: '用户表',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

module.exports = User;