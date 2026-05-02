import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum UserExamStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  SUBMITTED = 'submitted',
  GRADED = 'graded',
  FORCE_SUBMITTED = 'force_submitted',
}

export interface UserExamAttributes {
  id: string;
  examId: string;
  userId: string;
  status: UserExamStatus;
  attemptNumber: number;
  startTime?: Date;
  endTime?: Date;
  timeSpent?: number;
  totalScore?: number;
  objectiveScore?: number;
  subjectiveScore?: number;
  isPassed?: boolean;
  isLate: boolean;
  screenSwitchCount: number;
  copyPasteCount: number;
  warningCount: number;
  hasAnomaly: boolean;
  autoSavedAt?: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  gradedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserExam extends Model<UserExamAttributes> implements UserExamAttributes {
  public id!: string;
  public examId!: string;
  public userId!: string;
  public status!: UserExamStatus;
  public attemptNumber!: number;
  public startTime?: Date;
  public endTime?: Date;
  public timeSpent?: number;
  public totalScore?: number;
  public objectiveScore?: number;
  public subjectiveScore?: number;
  public isPassed?: boolean;
  public isLate!: boolean;
  public screenSwitchCount!: number;
  public copyPasteCount!: number;
  public warningCount!: number;
  public hasAnomaly!: boolean;
  public autoSavedAt?: Date;
  public submittedAt?: Date;
  public gradedAt?: Date;
  public gradedById?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserExam.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'exams',
        key: 'id',
      },
      field: 'exam_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'user_id',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserExamStatus)),
      allowNull: false,
      defaultValue: UserExamStatus.NOT_STARTED,
    },
    attemptNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'attempt_number',
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time',
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'time_spent',
      comment: '用时（秒）',
    },
    totalScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'total_score',
    },
    objectiveScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'objective_score',
    },
    subjectiveScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'subjective_score',
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'is_passed',
    },
    isLate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_late',
    },
    screenSwitchCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'screen_switch_count',
    },
    copyPasteCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'copy_paste_count',
    },
    warningCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'warning_count',
    },
    hasAnomaly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_anomaly',
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
    gradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'graded_at',
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
  },
  {
    sequelize,
    tableName: 'user_exams',
    indexes: [
      { fields: ['exam_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['has_anomaly'] },
      { fields: ['exam_id', 'user_id'] },
      { fields: ['is_passed'] },
    ],
  }
);
