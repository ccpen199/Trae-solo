import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum ExamPaperStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface ExamPaperAttributes {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  status: ExamPaperStatus;
  totalScore: number;
  totalQuestions: number;
  isRandomQuestions: boolean;
  isRandomOptions: boolean;
  strategyData?: ExamPaperStrategy;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamPaperStrategy {
  type: 'intelligent' | 'manual';
  intelligentRules?: IntelligentRule[];
  manualQuestions?: ManualQuestion[];
}

export interface IntelligentRule {
  knowledgePointId?: string;
  knowledgePointName?: string;
  questionType?: string;
  difficulty?: string;
  count: number;
  scorePerQuestion: number;
}

export interface ManualQuestion {
  questionId: string;
  score: number;
  sortOrder: number;
}

export class ExamPaper extends Model<ExamPaperAttributes> implements ExamPaperAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public creatorId!: string;
  public status!: ExamPaperStatus;
  public totalScore!: number;
  public totalQuestions!: number;
  public isRandomQuestions!: boolean;
  public isRandomOptions!: boolean;
  public strategyData?: ExamPaperStrategy;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExamPaper.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'creator_id',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ExamPaperStatus)),
      allowNull: false,
      defaultValue: ExamPaperStatus.DRAFT,
    },
    totalScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_score',
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_questions',
    },
    isRandomQuestions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_random_questions',
    },
    isRandomOptions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_random_options',
    },
    strategyData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'strategy_data',
    },
  },
  {
    sequelize,
    tableName: 'exam_papers',
    indexes: [
      { fields: ['status'] },
      { fields: ['creator_id'] },
    ],
  }
);
