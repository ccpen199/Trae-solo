const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enterprise = sequelize.define('Enterprise', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '企业名称',
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    comment: '企业编码',
  },
  industryType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '行业类型',
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '地址',
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '纬度',
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '经度',
  },
  legalPerson: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '法人',
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '联系电话',
  },
  creditScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: '信用评分(0-100)',
  },
  complianceStatus: {
    type: DataTypes.ENUM('compliant', 'warning', 'non_compliant'),
    defaultValue: 'compliant',
    comment: '合规状态',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    readOnly: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    readOnly: true,
  },
}, {
  tableName: 'enterprises',
  comment: '企业表',
});

Enterprise.associate = (models) => {
  Enterprise.hasMany(models.User, {
    foreignKey: 'enterpriseId',
    as: 'users',
  });
  Enterprise.hasMany(models.MonitorPoint, {
    foreignKey: 'enterpriseId',
    as: 'monitorPoints',
  });
  Enterprise.hasMany(models.ViolationEvent, {
    foreignKey: 'enterpriseId',
    as: 'violationEvents',
  });
  Enterprise.hasMany(models.InspectionOrder, {
    foreignKey: 'enterpriseId',
    as: 'inspectionOrders',
  });
};

module.exports = Enterprise;
