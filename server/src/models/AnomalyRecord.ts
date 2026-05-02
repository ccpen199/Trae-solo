import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export enum AnomalyType {
  SCREEN_SWITCH = 'screen_switch',
  COPY_PASTE = 'copy_paste',
  IDLE_TIMEOUT = 'idle_timeout',
  MULTIPLE_TABS = 'multiple_tabs',
  FORCE_SUBMIT = 'force_submit',
  SUSPICIOUS_BEHAVIOR = 'suspicious_behavior',
}

export enum AnomalySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AnomalyStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
  CONFIRMED = 'confirmed',
}

export interface AnomalyRecordAttributes {
  id: string;
  userExamId: string;
  userId: string;
  examId: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  description: string;
  details?: Record<string, unknown>;
  occurredAt: Date;
  reviewedById?: string;
  reviewedAt?: Date;
  reviewComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AnomalyRecord extends Model<AnomalyRecordAttributes> implements AnomalyRecordAttributes {
  public id!: string;
  public userExamId!: string;
  public userId!: string;
  public examId!: string;
  public type!: AnomalyType;
  public severity!: AnomalySeverity;
  public status!: AnomalyStatus;
  public description!: string;
  public details?: Record<string, unknown>;
  public occurredAt!: Date;
  public reviewedById?: string;
  public reviewedAt?: Date;
  public reviewComment?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AnomalyRecord.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'user_id',
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
    type: {
      type: DataTypes.ENUM(...Object.values(AnomalyType)),
      allowNull: false,
    },
    severity: {
      type: DataTypes.ENUM(...Object.values(AnomalySeverity)),
      allowNull: false,
      defaultValue: AnomalySeverity.MEDIUM,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(AnomalyStatus)),
      allowNull: false,
      defaultValue: AnomalyStatus.PENDING,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    occurredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'occurred_at',
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
    tableName: 'anomaly_records',
    indexes: [
      { fields: ['user_exam_id'] },
      { fields: ['user_id'] },
      { fields: ['exam_id'] },
      { fields: ['type'] },
      { fields: ['severity'] },
      { fields: ['status'] },
      { fields: ['occurred_at'] },
    ],
  }
);
