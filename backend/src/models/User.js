const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');

const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

let UserModel = null;

const initUser = (sequelize) => {
  if (UserModel) return UserModel;

  class User extends Model {
    static ROLES = USER_ROLES;

    async validatePassword(password) {
      return bcrypt.compare(password, this.password);
    }

    async hashPassword() {
      if (this.changed('password')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      delete values.password;
      return values;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 50]
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 255]
        }
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      role: {
        type: DataTypes.ENUM(...Object.values(USER_ROLES)),
        allowNull: false,
        defaultValue: USER_ROLES.USER
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
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
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      hooks: {
        beforeCreate: async (user) => {
          await user.hashPassword();
        },
        beforeUpdate: async (user) => {
          await user.hashPassword();
        }
      }
    }
  );

  UserModel = User;
  return User;
};

const getUser = () => {
  if (!UserModel) {
    throw new Error('User model not initialized. Call initUser() first.');
  }
  return UserModel;
};

module.exports = {
  initUser,
  getUser,
  USER_ROLES
};
