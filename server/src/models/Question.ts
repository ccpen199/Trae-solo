import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  MATERIAL = 'material',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
}

export interface QuestionAttributes {
  id: string;
  title: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  score: number;
  content: string;
  explanation?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  knowledgePointId?: string;
  creatorId: string;
  isShared: boolean;
  isActive: boolean;
  useCount: number;
  correctRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  id: string;
  label: string;
  content: string;
  isCorrect?: boolean;
}

export class Question extends Model<QuestionAttributes> implements QuestionAttributes {
  public id!: string;
  public title!: string;
  public type!: QuestionType;
  public difficulty!: DifficultyLevel;
  public score!: number;
  public content!: string;
  public explanation?: string;
  public options?: QuestionOption[];
  public correctAnswer?: string;
  public knowledgePointId?: string;
  public creatorId!: string;
  public isShared!: boolean;
  public isActive!: boolean;
  public useCount!: number;
  public correctRate?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Question.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(QuestionType)),
      allowNull: false,
      defaultValue: QuestionType.SINGLE_CHOICE,
    },
    difficulty: {
      type: DataTypes.ENUM(...Object.values(DifficultyLevel)),
      allowNull: false,
      defaultValue: DifficultyLevel.MEDIUM,
    },
    score: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 0,
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    correctAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'correct_answer',
    },
    knowledgePointId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'knowledge_points',
        key: 'id',
      },
      field: 'knowledge_point_id',
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
    isShared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_shared',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    useCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'use_count',
    },
    correctRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'correct_rate',
    },
  },
  {
    sequelize,
    tableName: 'questions',
    indexes: [
      { fields: ['type'] },
      { fields: ['difficulty'] },
      { fields: ['knowledge_point_id'] },
      { fields: ['creator_id'] },
      { fields: ['is_shared'] },
      { fields: ['is_active'] },
    ],
  }
);
