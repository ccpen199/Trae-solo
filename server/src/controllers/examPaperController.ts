import { Response } from 'express';
import { intelligentPaperEngine, IntelligentPaperParams, ManualPaperParams } from '../engines/IntelligentPaperEngine';
import { ExamPaper, ExamPaperStatus } from '../models/ExamPaper';
import { ExamPaperQuestion } from '../models/ExamPaperQuestion';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import { sequelize } from '../database/sequelize';
import { Op } from 'sequelize';
import { User } from '../models/User';

export const createIntelligentPaper = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const params: IntelligentPaperParams = {
      ...req.body,
      creatorId: req.user.id,
    };

    const result = await intelligentPaperEngine.generateIntelligentPaper(params);

    res.status(201).json({
      success: true,
      message: '智能组卷成功',
      data: result,
    });
  }
);

export const createManualPaper = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const params: ManualPaperParams = {
      ...req.body,
      creatorId: req.user.id,
    };

    const result = await intelligentPaperEngine.generateManualPaper(params);

    res.status(201).json({
      success: true,
      message: '人工组卷成功',
      data: result,
    });
  }
);

export const getPaper = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const result = await intelligentPaperEngine.getPaperDetails(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  }
);

export const getPapers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { status, creatorId, keyword, page, pageSize } = req.query;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (req.user && ![UserRole.ADMIN].includes(req.user.role)) {
      where.creatorId = req.user.id;
    } else if (creatorId) {
      where.creatorId = creatorId;
    }

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    const currentPage = page ? parseInt(page as string) : 1;
    const limit = pageSize ? parseInt(pageSize as string) : 20;
    const offset = (currentPage - 1) * limit;

    const { count, rows } = await ExamPaper.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'username'] },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: currentPage,
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  }
);

export const updatePaper = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;
    const { name, description, isRandomQuestions, isRandomOptions } = req.body;

    const examPaper = await ExamPaper.findByPk(id);
    if (!examPaper) {
      throw new AppError('试卷不存在', 404);
    }

    if (examPaper.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new AppError('无权修改此试卷', 403);
    }

    if (examPaper.status === ExamPaperStatus.PUBLISHED) {
      throw new AppError('已发布的试卷不能修改', 400);
    }

    await examPaper.update({
      name: name ?? examPaper.name,
      description: description ?? examPaper.description,
      isRandomQuestions: isRandomQuestions ?? examPaper.isRandomQuestions,
      isRandomOptions: isRandomOptions ?? examPaper.isRandomOptions,
    });

    const result = await intelligentPaperEngine.getPaperDetails(id);

    res.status(200).json({
      success: true,
      message: '试卷更新成功',
      data: result,
    });
  }
);

export const publishPaper = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;

    const examPaper = await intelligentPaperEngine.publishPaper(id, req.user.id);

    res.status(200).json({
      success: true,
      message: '试卷发布成功',
      data: {
        examPaper,
      },
    });
  }
);

export const archivePaper = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;

    const examPaper = await ExamPaper.findByPk(id);
    if (!examPaper) {
      throw new AppError('试卷不存在', 404);
    }

    if (examPaper.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new AppError('无权操作此试卷', 403);
    }

    await examPaper.update({ status: ExamPaperStatus.ARCHIVED });

    res.status(200).json({
      success: true,
      message: '试卷已归档',
      data: {
        examPaper,
      },
    });
  }
);

export const deletePaper = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;

    const examPaper = await ExamPaper.findByPk(id);
    if (!examPaper) {
      throw new AppError('试卷不存在', 404);
    }

    if (examPaper.creatorId !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new AppError('无权删除此试卷', 403);
    }

    if (examPaper.status === ExamPaperStatus.PUBLISHED) {
      throw new AppError('已发布的试卷不能删除，请先归档', 400);
    }

    const transaction = await sequelize.transaction();

    try {
      await ExamPaperQuestion.destroy({ where: { examPaperId: id }, transaction });
      await examPaper.destroy({ transaction });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: '试卷删除成功',
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);
