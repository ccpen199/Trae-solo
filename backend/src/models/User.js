const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    real_name: {
      type: DataTypes.STRING,
    },
    id_card: {
      type: DataTypes.STRING,
    },
    id_card_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    has_bank_card: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    wallet_balance: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'merchant'),
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

module.exports = User;
