import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IReminder } from '../types';

interface ReminderCreationAttributes extends Optional<IReminder, 'id' | 'createdAt' | 'updatedAt' | 'isRepeated' | 'repeatType' | 'isCompleted'> {}

class Reminder extends Model<IReminder, ReminderCreationAttributes> implements IReminder {
  public id!: number;
  public userId!: number;
  public dailyLogId!: number;
  public message!: string;
  public reminderDate!: Date;
  public isRepeated!: boolean;
  public repeatType!: 'daily' | 'weekly' | 'monthly';
  public isCompleted!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Reminder.init(
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
    dailyLogId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'daily_log_id',
      references: {
        model: 'daily_logs',
        key: 'id'
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    reminderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'reminder_date'
    },
    isRepeated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_repeated'
    },
    repeatType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      allowNull: true,
      field: 'repeat_type'
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_completed'
    }
  },
  {
    sequelize,
    tableName: 'reminders',
    timestamps: true,
    underscored: true
  }
);

export default Reminder;
