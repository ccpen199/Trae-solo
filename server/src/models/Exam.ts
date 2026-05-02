import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum ExamStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  ARCHIVED = 'archived',
}

export interface ExamAttributes {
  id: string;
  name: string;
  description?: string;
  examPaperId: string;
  creatorId: string;
  status: ExamStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalScore: number;
  passScore: number;
  allowLateEntry: boolean;
  lateEntryMinutes: number;
  showResultImmediately: boolean;
  allowReview: boolean;
  isRandomOrder: boolean;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Exam extends Model<ExamAttributes> implements ExamAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public examPaperId!: string;
  public creatorId!: string;
  public status!: ExamStatus;
  public startTime!: Date;
  public endTime!: Date;
  public duration!: number;
  public totalScore!: number;
  public passScore!: number;
  public allowLateEntry!: boolean;
  public lateEntryMinutes!: number;
  public showResultImmediately!: boolean;
  public allowReview!: boolean;
  public isRandomOrder!: boolean;
  public maxAttempts!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Exam.init(
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
    examPaperId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exam_papers',
        key: 'id',
      },
      field: 'exam_paper_id',
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
      type: DataTypes.ENUM(...Object.values(ExamStatus)),
      allowNull: false,
      defaultValue: ExamStatus.DRAFT,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '考试时长（分钟）',
    },
    totalScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 100,
      field: 'total_score',
    },
    passScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 60,
      field: 'pass_score',
    },
    allowLateEntry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allow_late_entry',
    },
    lateEntryMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'late_entry_minutes',
    },
    showResultImmediately: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'show_result_immediately',
    },
    allowReview: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allow_review',
    },
    isRandomOrder: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_random_order',
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'max_attempts',
    },
  },
  {
    sequelize,
    tableName: 'exams',
    indexes: [
      { fields: ['status'] },
      { fields: ['start_time'] },
      { fields: ['end_time'] },
      { fields: ['exam_paper_id'] },
      { fields: ['creator_id'] },
    ],
  }
);
