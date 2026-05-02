import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum GradingStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
}

export interface GradingRecordAttributes {
  id: string;
  userExamId: string;
  userAnswerId: string;
  questionId: string;
  graderId: string;
  status: GradingStatus;
  originalScore?: number;
  givenScore?: number;
  maxScore: number;
  gradingComment?: string;
  isAutoGraded: boolean;
  autoGradeScore?: number;
  autoGradeReason?: string;
  startedAt?: Date;
  completedAt?: Date;
  reviewedById?: string;
  reviewedAt?: Date;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GradingRecord extends Model<GradingRecordAttributes> implements GradingRecordAttributes {
  public id!: string;
  public userExamId!: string;
  public userAnswerId!: string;
  public questionId!: string;
  public graderId!: string;
  public status!: GradingStatus;
  public originalScore?: number;
  public givenScore?: number;
  public maxScore!: number;
  public gradingComment?: string;
  public isAutoGraded!: boolean;
  public autoGradeScore?: number;
  public autoGradeReason?: string;
  public startedAt?: Date;
  public completedAt?: Date;
  public reviewedById?: string;
  public reviewedAt?: Date;
  public reviewComment?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GradingRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userExamId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user_exams',
        key: 'id',
      },
      field: 'user_exam_id',
    },
    userAnswerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user_answers',
        key: 'id',
      },
      field: 'user_answer_id',
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
      field: 'question_id',
    },
    graderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'grader_id',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(GradingStatus)),
      allowNull: false,
      defaultValue: GradingStatus.PENDING,
    },
    originalScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'original_score',
    },
    givenScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'given_score',
    },
    maxScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'max_score',
    },
    gradingComment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'grading_comment',
    },
    isAutoGraded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_auto_graded',
    },
    autoGradeScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'auto_grade_score',
    },
    autoGradeReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'auto_grade_reason',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
    reviewedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'reviewed_by_id',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
    },
    reviewComment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_comment',
    },
  },
  {
    sequelize,
    tableName: 'grading_records',
    indexes: [
      { fields: ['user_exam_id'] },
      { fields: ['user_answer_id'] },
      { fields: ['grader_id'] },
      { fields: ['status'] },
      { fields: ['is_auto_graded'] },
    ],
  }
);
