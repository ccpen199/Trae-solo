import { Op, Transaction } from 'sequelize';
import { Question, QuestionType, DifficultyLevel, QuestionOption } from '../models/Question';
import { KnowledgePoint } from '../models/KnowledgePoint';
import { User } from '../models/User';
import { sequelize } from '../database/sequelize';

export interface QuestionQueryParams {
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  knowledgePointId?: string;
  creatorId?: string;
  isShared?: boolean;
  isActive?: boolean;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface QuestionCreateParams {
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
  isShared?: boolean;
}

export interface QuestionUpdateParams {
  title?: string;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  score?: number;
  content?: string;
  explanation?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  knowledgePointId?: string;
  isShared?: boolean;
  isActive?: boolean;
}

export interface QuestionStatistics {
  total: number;
  byType: Record<QuestionType, number>;
  byDifficulty: Record<DifficultyLevel, number>;
  byKnowledgePoint: Array<{
    id: string;
    name: string;
    count: number;
  }>;
}

export class QuestionBankEngine {
  private validateQuestionParams(params: QuestionCreateParams): void {
    const { type, options, correctAnswer } = params;
    
    if ([QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE].includes(type)) {
      if (!options || options.length < 2) {
        throw new Error('选择题至少需要2个选项');
      }
      const correctOptions = options.filter(o => o.isCorrect);
      if (correctOptions.length === 0) {
        throw new Error('选择题至少需要一个正确选项');
      }
      if (type === QuestionType.SINGLE_CHOICE && correctOptions.length > 1) {
        throw new Error('单选题只能有一个正确选项');
      }
    }
    
    if (type === QuestionType.TRUE_FALSE) {
      if (!correctAnswer || !['true', 'false'].includes(correctAnswer.toLowerCase())) {
        throw new Error('判断题正确答案必须是 true 或 false');
      }
    }
    
    if ([QuestionType.SHORT_ANSWER, QuestionType.ESSAY, QuestionType.MATERIAL].includes(type)) {
      if (!params.explanation) {
        console.warn('主观题建议提供评分说明');
      }
    }
  }

  async createQuestion(params: QuestionCreateParams, transaction?: Transaction): Promise<Question> {
    this.validateQuestionParams(params);
    
    const question = await Question.create(
      {
        title: params.title,
        type: params.type,
        difficulty: params.difficulty,
        score: params.score,
        content: params.content,
        explanation: params.explanation,
        options: params.options,
        correctAnswer: params.correctAnswer,
        knowledgePointId: params.knowledgePointId,
        creatorId: params.creatorId,
        isShared: params.isShared ?? false,
        isActive: true,
        useCount: 0,
      },
      { transaction }
    );
    
    return question;
  }

  async getQuestionById(id: string, includeDetails: boolean = true): Promise<Question | null> {
    const include = includeDetails
      ? [
          { model: KnowledgePoint, as: 'knowledgePoint' },
          { model: User, as: 'creator', attributes: ['id', 'name', 'username'] },
        ]
      : undefined;
    
    return Question.findByPk(id, { include });
  }

  async getQuestions(params: QuestionQueryParams): Promise<{
    data: Question[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      type,
      difficulty,
      knowledgePointId,
      creatorId,
      isShared,
      isActive,
      keyword,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Record<string, unknown> = {};
    
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (knowledgePointId) where.knowledgePointId = knowledgePointId;
    if (creatorId) where.creatorId = creatorId;
    if (isShared !== undefined) where.isShared = isShared;
    if (isActive !== undefined) where.isActive = isActive;
    
    if (keyword) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { content: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await Question.findAndCountAll({
      where,
      include: [
        { model: KnowledgePoint, as: 'knowledgePoint' },
        { model: User, as: 'creator', attributes: ['id', 'name', 'username'] },
      ],
      limit: pageSize,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      data: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async updateQuestion(
    id: string,
    params: QuestionUpdateParams,
    userId: string,
    transaction?: Transaction
  ): Promise<Question | null> {
    const question = await Question.findByPk(id);
    if (!question) {
      return null;
    }

    if (question.creatorId !== userId) {
      const user = await User.findByPk(userId);
      if (!user || !['admin'].includes(user.role)) {
        throw new Error('无权修改此题目');
      }
    }

    await question.update(params, { transaction });
    return question.reload();
  }

  async deleteQuestion(id: string, userId: string, transaction?: Transaction): Promise<boolean> {
    const question = await Question.findByPk(id);
    if (!question) {
      return false;
    }

    if (question.creatorId !== userId) {
      const user = await User.findByPk(userId);
      if (!user || !['admin'].includes(user.role)) {
        throw new Error('无权删除此题目');
      }
    }

    if (question.useCount > 0) {
      await question.update({ isActive: false }, { transaction });
      return true;
    }

    await question.destroy({ transaction });
    return true;
  }

  async getStatistics(
    knowledgePointId?: string,
    creatorId?: string
  ): Promise<QuestionStatistics> {
    const where: Record<string, unknown> = { isActive: true };
    if (knowledgePointId) where.knowledgePointId = knowledgePointId;
    if (creatorId) where.creatorId = creatorId;

    const total = await Question.count({ where });

    const byTypeResult = await Question.findAll({
      where,
      attributes: ['type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['type'],
      raw: true,
    });

    const byType = Object.values(QuestionType).reduce(
      (acc, type) => {
        const item = byTypeResult.find((r: { type: string; count: string }) => r.type === type);
        acc[type] = item ? parseInt(item.count) : 0;
        return acc;
      },
      {} as Record<QuestionType, number>
    );

    const byDifficultyResult = await Question.findAll({
      where,
      attributes: ['difficulty', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['difficulty'],
      raw: true,
    });

    const byDifficulty = Object.values(DifficultyLevel).reduce(
      (acc, diff) => {
        const item = byDifficultyResult.find(
          (r: { difficulty: string; count: string }) => r.difficulty === diff
        );
        acc[diff] = item ? parseInt(item.count) : 0;
        return acc;
      },
      {} as Record<DifficultyLevel, number>
    );

    const byKnowledgePoint = await Question.findAll({
      where,
      include: [{ model: KnowledgePoint, as: 'knowledgePoint' }],
      attributes: [
        'knowledgePointId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['knowledgePointId', 'knowledgePoint.id', 'knowledgePoint.name'],
      raw: true,
    });

    const knowledgePointStats = byKnowledgePoint
      .filter((item: { knowledgePointId: string | null }) => item.knowledgePointId)
      .map((item: { knowledgePointId: string; count: string; 'knowledgePoint.name': string }) => ({
        id: item.knowledgePointId,
        name: item['knowledgePoint.name'] || '未知知识点',
        count: parseInt(item.count),
      }));

    return {
      total,
      byType,
      byDifficulty,
      byKnowledgePoint: knowledgePointStats,
    };
  }

  async incrementUseCount(questionIds: string[], transaction?: Transaction): Promise<void> {
    await Question.increment('useCount', {
      where: { id: { [Op.in]: questionIds } },
      by: 1,
      transaction,
    });
  }

  async updateCorrectRate(questionId: string, isCorrect: boolean): Promise<void> {
    const question = await Question.findByPk(questionId);
    if (!question) return;

    const currentRate = question.correctRate ?? 0;
    const currentCount = question.useCount;
    
    if (currentCount > 0) {
      const correctCount = Math.round(currentRate * currentCount / 100);
      const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
      const newRate = (newCorrectCount / (currentCount + 1)) * 100;
      
      await question.update({ correctRate: Math.round(newRate * 100) / 100 });
    }
  }
}

export const questionBankEngine = new QuestionBankEngine();
