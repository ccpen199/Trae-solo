const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class PregnancyRecord extends Model {}

PregnancyRecord.init(
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
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '体重(kg)'
    },
    bloodPressureSystolic: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'blood_pressure_systolic',
      comment: '收缩压(mmHg)'
    },
    bloodPressureDiastolic: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'blood_pressure_diastolic',
      comment: '舒张压(mmHg)'
    },
    fundalHeight: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      field: 'fundal_height',
      comment: '宫高(cm)'
    },
    abdominalCircumference: {
      type: DataTypes.DECIMAL(5, 1),
      allowNull: true,
      field: 'abdominal_circumference',
      comment: '腹围(cm)'
    },
    fetalHeartRate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'fetal_heart_rate',
      comment: '胎心率(bpm)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mood: {
      type: DataTypes.ENUM('happy', 'calm', 'anxious', 'sad', 'irritable'),
      allowNull: true,
      comment: '心情状态'
    },
    symptoms: {
      type: DataTypes.ARRAY(DataTypes.STRING(100)),
      allowNull: true,
      defaultValue: [],
      comment: '身体症状'
    }
  },
  {
    sequelize,
    modelName: 'PregnancyRecord',
    tableName: 'pregnancy_records',
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

module.exports = PregnancyRecord;
