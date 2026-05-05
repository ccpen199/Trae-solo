const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Department extends Model {}

Department.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '部门名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '部门编码'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '部门描述'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '父级部门ID'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '状态：true-启用, false-禁用'
    }
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    timestamps: true,
    paranoid: true,
    comment: '部门表'
  }
);

module.exports = Department;
