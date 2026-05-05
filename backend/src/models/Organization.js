const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Organization extends Model {}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '机构名称'
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: '机构编码'
    },
    type: {
      type: DataTypes.ENUM('company', 'department', 'group'),
      defaultValue: 'department',
      comment: '机构类型：公司、部门、小组'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'parent_id',
      comment: '上级机构ID'
    },
    leaderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'leader_id',
      comment: '负责人ID'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
      comment: '状态：启用、停用'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '描述'
    }
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    timestamps: true,
    paranoid: true,
    underscored: true
  }
);

Organization.belongsTo(Organization, { 
  as: 'parent', 
  foreignKey: 'parentId',
  onDelete: 'SET NULL'
});

Organization.hasMany(Organization, { 
  as: 'children', 
  foreignKey: 'parentId'
});

module.exports = Organization;
