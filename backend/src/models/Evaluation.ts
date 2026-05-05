import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { IEvaluation } from '../types';

interface EvaluationCreationAttributes extends Optional<IEvaluation, 'id' | 'createdAt' | 'updatedAt' | 'score' | 'comment'> {}

class Evaluation extends Model<IEvaluation, EvaluationCreationAttributes> implements IEvaluation {
  public id!: number;
  public dailyLogId!: number;
  public evaluatorId!: number;
  public score!: number;
  public comment!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Evaluation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    dailyLogId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'daily_log_id',
      references: {
        model: 'daily_logs',
        key: 'id'
      }
    },
    evaluatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'evaluator_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'evaluations',
    timestamps: true,
    underscored: true
  }
);

export default Evaluation;
