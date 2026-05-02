import { Response } from 'express';
import { questionBankEngine, QuestionCreateParams, QuestionUpdateParams, QuestionQueryParams } from '../engines/QuestionBankEngine';
import { Question, QuestionType, DifficultyLevel } from '../models/Question';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import { sequelize } from '../database/sequelize';

export const createQuestion = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const params: QuestionCreateParams = {
      ...req.body,
      creatorId: req.user.id,
    };

    const question = await questionBankEngine.createQuestion(params);

    res.status(201).json({
      success: true,
      message: '题目创建成功',
      data: {
        question,
      },
    });
  }
);

export const getQuestion = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    
    const question = await questionBankEngine.getQuestionById(id, true);
    
    if (!question) {
      throw new AppError('题目不存在', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        question,
      },
    });
  }
);

export const getQuestions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const {
      type,
      difficulty,
      knowledgePointId,
      creatorId,
      isShared,
      isActive,
      keyword,
      page,
      pageSize,
    } = req.query;

    const params: QuestionQueryParams = {
      type: type as QuestionType | undefined,
      difficulty: difficulty as DifficultyLevel | undefined,
      knowledgePointId: knowledgePointId as string | undefined,
      creatorId: creatorId as string | undefined,
      isShared: isShared !== undefined ? isShared === 'true' : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      keyword: keyword as string | undefined,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
    };

    if (req.user && ![UserRole.ADMIN, UserRole.QUESTION_SETTER].includes(req.user.role)) {
      params.isShared = true;
    }

    const result = await questionBankEngine.getQuestions(params);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

export const updateQuestion = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;
    const params: QuestionUpdateParams = req.body;

    const question = await questionBankEngine.updateQuestion(id, params, req.user.id);

    if (!question) {
      throw new AppError('题目不存在', 404);
    }

    res.status(200).json({
      success: true,
      message: '题目更新成功',
      data: {
        question,
      },
    });
  }
);

export const deleteQuestion = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;

    const deleted = await questionBankEngine.deleteQuestion(id, req.user.id);

    if (!deleted) {
      throw new AppError('题目不存在', 404);
    }

    res.status(200).json({
      success: true,
      message: '题目删除成功',
    });
  }
);

export const getStatistics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { knowledgePointId, creatorId } = req.query;

    const statistics = await questionBankEngine.getStatistics(
      knowledgePointId as string | undefined,
      creatorId as string | undefined
    );

    res.status(200).json({
      success: true,
      data: {
        statistics,
      },
    });
  }
);

export const batchCreateQuestions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new AppError('请提供有效的题目列表', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      const createdQuestions = [];

      for (const q of questions) {
        const params: QuestionCreateParams = {
          ...q,
          creatorId: req.user!.id,
        };

        const question = await questionBankEngine.createQuestion(params, transaction);
        createdQuestions.push(question);
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        message: `成功创建 ${createdQuestions.length} 道题目`,
        data: {
          questions: createdQuestions,
          count: createdQuestions.length,
        },
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);

export const getQuestionTypes = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const typeMap: Record<string, string> = {
      [QuestionType.SINGLE_CHOICE]: '单选题',
      [QuestionType.MULTIPLE_CHOICE]: '多选题',
      [QuestionType.TRUE_FALSE]: '判断题',
      [QuestionType.SHORT_ANSWER]: '简答题',
      [QuestionType.ESSAY]: '论述题',
      [QuestionType.MATERIAL]: '材料题',
    };

    const types = Object.values(QuestionType).map((type) => ({
      value: type,
      label: typeMap[type] || type,
    }));

    res.status(200).json({
      success: true,
      data: {
        types,
      },
    });
  }
);

export const getDifficultyLevels = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    const diffMap: Record<string, string> = {
      [DifficultyLevel.EASY]: '简单',
      [DifficultyLevel.MEDIUM]: '中等',
      [DifficultyLevel.HARD]: '困难',
      [DifficultyLevel.VERY_HARD]: '极难',
    };

    const levels = Object.values(DifficultyLevel).map((diff) => ({
      value: diff,
      label: diffMap[diff] || diff,
    }));

    res.status(200).json({
      success: true,
      data: {
        levels,
      },
    });
  }
);
