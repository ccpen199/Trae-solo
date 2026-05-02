import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database/sequelize';

export interface ExamPaperQuestionAttributes {
  id: string;
  examPaperId: string;
  questionId: string;
  score: number;
  sortOrder: number;
  section?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ExamPaperQuestion extends Model<ExamPaperQuestionAttributes> implements ExamPaperQuestionAttributes {
  public id!: string;
  public examPaperId!: string;
  public questionId!: string;
  public score!: number;
  public sortOrder!: number;
  public section?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExamPaperQuestion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
      field: 'question_id',
    },
    score: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    section: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'exam_paper_questions',
    indexes: [
      { fields: ['exam_paper_id'] },
      { fields: ['question_id'] },
      { fields: ['exam_paper_id', 'sort_order'] },
    ],
  }
);
