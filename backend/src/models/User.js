const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

class User extends Model {
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: '用户名不能为空' },
        len: { args: [2, 50], msg: '用户名长度应在2-50个字符之间' }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: '密码不能为空' }
      }
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'real_name',
      validate: {
        notEmpty: { msg: '真实姓名不能为空' }
      }
    },
    role: {
      type: DataTypes.ENUM(...Object.values(USER_ROLES)),
      allowNull: false,
      defaultValue: USER_ROLES.USER,
      validate: {
        isIn: {
          args: [Object.values(USER_ROLES)],
          msg: '角色类型无效'
        }
      }
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '所属部门/派出所'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { unique: true, fields: ['username'] },
      { fields: ['role'] },
      { fields: ['is_active'] }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await User.hashPassword(user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password = await User.hashPassword(user.password);
        }
      }
    }
  }
);

// 初始化默认管理员账户
User.initializeDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        realName: '系统管理员',
        role: USER_ROLES.ADMIN,
        department: '系统管理部'
      });
      console.log('默认管理员账户创建成功: 用户名 admin, 密码 admin123');
    }
  } catch (error) {
    console.error('初始化默认管理员账户失败:', error.message);
  }
};

module.exports = {
  User,
  USER_ROLES
};
