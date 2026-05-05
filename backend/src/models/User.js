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
      unique: true,
      allowNull: false,
      comment: '用户名'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码'
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'real_name',
      comment: '真实姓名'
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '邮箱'
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: '手机号'
    },
    avatar: {
      type: DataTypes.STRING(500),
      comment: '头像地址'
    },
    orgId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'org_id',
      comment: '所属机构ID'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'locked'),
      defaultValue: 'active',
      comment: '状态：启用、停用、锁定'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at',
      comment: '最后登录时间'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  }
);

module.exports = User;
