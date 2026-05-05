const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RolePermission extends Model {}

RolePermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'role_id'
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id'
    }
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true
  }
);

module.exports = RolePermission;
