const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class FetalMovement extends Model {}

FetalMovement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recordDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'record_date'
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time'
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'duration_minutes',
      comment: '持续时间(分钟)'
    },
    movementCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'movement_count',
      comment: '胎动次数'
    },
    intensity: {
      type: DataTypes.ENUM('weak', 'normal', 'strong'),
      defaultValue: 'normal',
      allowNull: true,
      comment: '胎动强度'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'FetalMovement',
    tableName: 'fetal_movements',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['record_date']
      }
    ]
  }
);

module.exports = FetalMovement;
