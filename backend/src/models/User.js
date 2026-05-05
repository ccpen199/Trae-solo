const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '手机号，用于登录'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码，默认手机号后6位'
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: true,
    comment: '身份证号'
  },
  realName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '真实姓名'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '城市'
  },
  district: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '区域'
  },
  project: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '项目名称'
  },
  building: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '楼栋'
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '楼层'
  },
  houseType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '户型（如一室一厅、三室两厅）'
  },
  houseArea: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '房屋面积（平方米）'
  },
  floorPlanId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '平面效果图ID'
  },
  floorPlanUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '平面效果图URL'
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '头像URL'
  },
  status: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '状态：1-正常，0-禁用'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  indexes: [
    { unique: true, fields: ['phone'] }
  ]
});

User.beforeCreate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.createWithDefaultPassword = async function(userData) {
  const defaultPassword = userData.phone.slice(-6);
  return User.create({
    ...userData,
    password: defaultPassword
  });
};

module.exports = User;
