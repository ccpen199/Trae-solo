const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('regulator', 'enterprise', 'vendor', 'public'),
    allowNull: false,
    comment: 'regulator:监管员, enterprise:企业负责人, vendor:第三方运维, public:公众参与者',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  enterpriseId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '企业用户关联的企业ID',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'users',
  comment: '用户表',
});

User.associate = (models) => {
  User.belongsTo(models.Enterprise, {
    foreignKey: 'enterpriseId',
    as: 'enterprise',
  });
  User.hasMany(models.InspectionOrder, {
    foreignKey: 'regulatorId',
    as: 'inspectionOrders',
  });
  User.hasMany(models.Notification, {
    foreignKey: 'userId',
    as: 'notifications',
  });
};

module.exports = User;
