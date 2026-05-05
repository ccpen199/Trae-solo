import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IMissingLogRecord } from '../types';

interface MissingLogRecordCreationAttributes extends Optional<IMissingLogRecord, 'id' | 'createdAt' | 'isNotified'> {}

class MissingLogRecord extends Model<IMissingLogRecord, MissingLogRecordCreationAttributes> implements IMissingLogRecord {
  public id!: number;
  public userId!: number;
  public date!: Date;
  public logType!: 'daily' | 'project_feedback';
  public isNotified!: boolean;
  public readonly createdAt!: Date;
}

MissingLogRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    logType: {
      type: DataTypes.ENUM('daily', 'project_feedback'),
      defaultValue: 'daily',
      field: 'log_type'
    },
    isNotified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_notified'
    }
  },
  {
    sequelize,
    tableName: 'missing_log_records',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'date', 'log_type']
      },
      {
        fields: ['date']
      },
      {
        fields: ['is_notified']
      }
    ]
  }
);

export default MissingLogRecord;
