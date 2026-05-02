import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum AnswerStatus {
  SAVED = 'saved',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
}

export interface UserAnswerAttributes {
  id: string;
  userExamId: string;
  questionId: string;
  examPaperQuestionId: string;
  answerContent?: string;
  answerOptions?: string[];
  isCorrect?: boolean;
  score?: number;
  maxScore: number;
  status: AnswerStatus;
  isAutoGraded: boolean;
  gradingComment?: string;
  gradedById?: string;
  gradedAt?: Date;
  autoSavedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserAnswer extends Model<UserAnswerAttributes> implements UserAnswerAttributes {
  public id!: string;
  public userExamId!: string;
  public questionId!: string;
  public examPaperQuestionId!: string;
  public answerContent?: string;
  public answerOptions?: string[];
  public isCorrect?: boolean;
  public score?: number;
  public maxScore!: number;
  public status!: AnswerStatus;
  public isAutoGraded!: boolean;
  public gradingComment?: string;
  public gradedById?: string;
  public gradedAt?: Date;
  public autoSavedAt?: Date;
  public submittedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserAnswer.init(
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
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
      field: 'question_id',
    },
    examPaperQuestionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exam_paper_questions',
        key: 'id',
      },
      field: 'exam_paper_question_id',
    },
    answerContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'answer_content',
    },
    answerOptions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      field: 'answer_options',
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'is_correct',
    },
    score: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    maxScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'max_score',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AnswerStatus)),
      allowNull: false,
      defaultValue: AnswerStatus.SAVED,
    },
    isAutoGraded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_auto_graded',
    },
    gradingComment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'grading_comment',
    },
    gradedById: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'graded_by_id',
    },
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'graded_at',
    },
    autoSavedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'auto_saved_at',
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at',
    },
  },
  {
    sequelize,
    tableName: 'user_answers',
    indexes: [
      { fields: ['user_exam_id'] },
      { fields: ['question_id'] },
      { fields: ['status'] },
      { fields: ['is_auto_graded'] },
      { fields: ['user_exam_id', 'question_id'] },
    ],
  }
);
