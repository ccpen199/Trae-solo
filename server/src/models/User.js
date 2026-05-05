const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const USER_TYPES = {
  PREGNANT: 'pregnant',
  PREPARING: 'preparing',
  EXPERIENCED: 'experienced'
};

class User extends Model {
  async validatePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  static getUserTypes() {
    return USER_TYPES;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phone: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    userType: {
      type: DataTypes.ENUM(...Object.values(USER_TYPES)),
      allowNull: false,
      defaultValue: USER_TYPES.PREGNANT,
      field: 'user_type'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date'
    },
    pregnancyWeek: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'pregnancy_week'
    },
    babyAge: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'baby_age'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      defaultValue: 'active',
      allowNull: false
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
