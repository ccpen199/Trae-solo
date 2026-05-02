import { Response } from 'express';
import { KnowledgePoint } from '../models/KnowledgePoint';
import { Question } from '../models/Question';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import { Op } from 'sequelize';

export const createKnowledgePoint = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { name, code, parentId, description, sortOrder } = req.body;

    if (!name || !code) {
      throw new AppError('名称和编码为必填项', 400);
    }

    const existing = await KnowledgePoint.findOne({ where: { code } });
    if (existing) {
      throw new AppError('编码已存在', 400);
    }

    const knowledgePoint = await KnowledgePoint.create({
      name,
      code,
      parentId,
      description,
      sortOrder: sortOrder ?? 0,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: '知识点创建成功',
      data: {
        knowledgePoint,
      },
    });
  }
);

export const getKnowledgePoint = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const knowledgePoint = await KnowledgePoint.findByPk(id, {
      include: [
        { model: KnowledgePoint, as: 'parent' },
        { model: KnowledgePoint, as: 'children' },
      ],
    });

    if (!knowledgePoint) {
      throw new AppError('知识点不存在', 404);
    }

    const questionCount = await Question.count({
      where: { knowledgePointId: id, isActive: true },
    });

    res.status(200).json({
      success: true,
      data: {
        knowledgePoint,
        questionCount,
      },
    });
  }
);

export const getKnowledgePoints = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { parentId, isActive, keyword, page, pageSize } = req.query;

    const where: Record<string, unknown> = {};

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${keyword}%` } },
        { code: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } },
      ];
    }

    const currentPage = page ? parseInt(page as string) : 1;
    const limit = pageSize ? parseInt(pageSize as string) : 100;
    const offset = (currentPage - 1) * limit;

    const { count, rows } = await KnowledgePoint.findAndCountAll({
      where,
      include: [
        { model: KnowledgePoint, as: 'parent' },
      ],
      limit,
      offset,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    const kpIds = rows.map((kp) => kp.id);
    const questionCounts = await Question.findAll({
      where: { knowledgePointId: { [Op.in]: kpIds }, isActive: true },
      attributes: [
        'knowledgePointId',
        [Op.fn('COUNT', Op.col('id')), 'count'],
      ],
      group: ['knowledgePointId'],
      raw: true,
    });

    const countMap = new Map(
      questionCounts.map((qc: { knowledge_point_id: string; count: string }) => [
        qc.knowledge_point_id,
        parseInt(qc.count),
      ])
    );

    const data = rows.map((kp) => ({
      ...kp.toJSON(),
      questionCount: countMap.get(kp.id) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        data,
        total: count,
        page: currentPage,
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  }
);

export const getKnowledgePointTree = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { isActive } = req.query;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const allKnowledgePoints = await KnowledgePoint.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    const kpIds = allKnowledgePoints.map((kp) => kp.id);
    const questionCounts = await Question.findAll({
      where: { knowledgePointId: { [Op.in]: kpIds }, isActive: true },
      attributes: [
        'knowledgePointId',
        [Op.fn('COUNT', Op.col('id')), 'count'],
      ],
      group: ['knowledgePointId'],
      raw: true,
    });

    const countMap = new Map(
      questionCounts.map((qc: { knowledge_point_id: string; count: string }) => [
        qc.knowledge_point_id,
        parseInt(qc.count),
      ])
    );

    const buildTree = (parentId: string | null): Array<Record<string, unknown>> => {
      return allKnowledgePoints
        .filter((kp) => kp.parentId === parentId)
        .map((kp) => ({
          id: kp.id,
          name: kp.name,
          code: kp.code,
          description: kp.description,
          sortOrder: kp.sortOrder,
          isActive: kp.isActive,
          questionCount: countMap.get(kp.id) || 0,
          children: buildTree(kp.id),
        }));
    };

    const tree = buildTree(null);

    res.status(200).json({
      success: true,
      data: {
        tree,
        total: allKnowledgePoints.length,
      },
    });
  }
);

export const updateKnowledgePoint = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;
    const { name, code, parentId, description, sortOrder, isActive } = req.body;

    const knowledgePoint = await KnowledgePoint.findByPk(id);
    if (!knowledgePoint) {
      throw new AppError('知识点不存在', 404);
    }

    if (code && code !== knowledgePoint.code) {
      const existing = await KnowledgePoint.findOne({ where: { code } });
      if (existing) {
        throw new AppError('编码已存在', 400);
      }
    }

    if (parentId === id) {
      throw new AppError('不能将自身设置为父节点', 400);
    }

    await knowledgePoint.update({
      name: name ?? knowledgePoint.name,
      code: code ?? knowledgePoint.code,
      parentId: parentId !== undefined ? parentId : knowledgePoint.parentId,
      description: description !== undefined ? description : knowledgePoint.description,
      sortOrder: sortOrder !== undefined ? sortOrder : knowledgePoint.sortOrder,
      isActive: isActive !== undefined ? isActive : knowledgePoint.isActive,
    });

    res.status(200).json({
      success: true,
      message: '知识点更新成功',
      data: {
        knowledgePoint: await knowledgePoint.reload(),
      },
    });
  }
);

export const deleteKnowledgePoint = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const { id } = req.params;

    const knowledgePoint = await KnowledgePoint.findByPk(id);
    if (!knowledgePoint) {
      throw new AppError('知识点不存在', 404);
    }

    const childCount = await KnowledgePoint.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new AppError(`该知识点下有 ${childCount} 个子知识点，请先删除或移动子知识点`, 400);
    }

    const questionCount = await Question.count({ where: { knowledgePointId: id } });
    if (questionCount > 0) {
      throw new AppError(`该知识点下有 ${questionCount} 道题目，请先删除或移动题目`, 400);
    }

    await knowledgePoint.destroy();

    res.status(200).json({
      success: true,
      message: '知识点删除成功',
    });
  }
);
