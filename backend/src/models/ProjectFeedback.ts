import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IProjectFeedback } from '../types';

interface ProjectFeedbackCreationAttributes extends Optional<IProjectFeedback, 'id' | 'createdAt' | 'updatedAt' | 'isReported' | 'dailyLogId'> {}

class ProjectFeedback extends Model<IProjectFeedback, ProjectFeedbackCreationAttributes> implements IProjectFeedback {
  public id!: number;
  public projectId!: number;
  public userId!: number;
  public dailyLogId!: number;
  public content!: string;
  public isReported!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProjectFeedback.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id',
      references: {
        model: 'projects',
        key: 'id'
      }
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isReported: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_reported'
    }
  },
  {
    sequelize,
    tableName: 'project_feedbacks',
    timestamps: true,
    underscored: true
  }
);

export default ProjectFeedback;
