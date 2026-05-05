import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IDailyLog } from '../types';

interface DailyLogCreationAttributes extends Optional<IDailyLog, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'isPlanCompleted' | 'relatedFees' | 'planTomorrow' | 'issues'> {}

class DailyLog extends Model<IDailyLog, DailyLogCreationAttributes> implements IDailyLog {
  public id!: number;
  public userId!: number;
  public date!: Date;
  public content!: string;
  public planTomorrow!: string;
  public issues!: string;
  public isPlanCompleted!: boolean;
  public relatedFees!: number;
  public status!: 'draft' | 'submitted' | 'reviewed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DailyLog.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    planTomorrow: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'plan_tomorrow'
    },
    issues: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPlanCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_plan_completed'
    },
    relatedFees: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'related_fees'
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'reviewed'),
      defaultValue: 'draft',
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'daily_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'date']
      },
      {
        fields: ['date']
      },
      {
        fields: ['status']
      }
    ]
  }
);

export default DailyLog;
