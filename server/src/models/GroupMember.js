const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class GroupMember extends Model {}

GroupMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'member',
      allowNull: false,
      validate: {
        isIn: [['owner', 'admin', 'member']]
      }
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      allowNull: false,
      validate: {
        isIn: [['pending', 'active', 'rejected', 'banned']]
      }
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GroupMember',
    tableName: 'group_members',
    timestamps: true,
    indexes: [
      { fields: ['groupId', 'userId'], unique: true },
      { fields: ['userId'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = GroupMember;
