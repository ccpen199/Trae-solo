import { Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../config/prisma';
import { successResponse, errorResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { AccountStatus } from '../types/prisma';

export const createAccountValidation = [
  body('title').notEmpty().withMessage('标题不能为空').isLength({ max: 100 }).withMessage('标题不能超过100个字符'),
  body('description').optional().isLength({ max: 2000 }).withMessage('描述不能超过2000个字符'),
  body('gameName').notEmpty().withMessage('游戏名称不能为空'),
  body('gameServer').optional(),
  body('accountLevel').optional().isInt({ min: 1 }).withMessage('账号等级必须大于0'),
  body('price').notEmpty().withMessage('价格不能为空').isFloat({ min: 0 }).withMessage('价格必须大于等于0'),
  body('originalPrice').optional().isFloat({ min: 0 }).withMessage('原价必须大于等于0'),
];

export const getAccountsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('status').optional(),
  query('gameName').optional(),
  query('sellerId').optional(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sortBy').optional().isIn(['createdAt', 'price', 'viewCount']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

export const getAccountById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const account = await prisma.gameAccount.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
        images: {
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!account) {
      return errorResponse(res, 404, '账号不存在');
    }

    await prisma.gameAccount.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    successResponse(res, { ...account, viewCount: account.viewCount + 1 });
  } catch (error) {
    console.error('Get account by id error:', error);
    errorResponse(res, 500, '获取账号信息失败');
  }
};

export const getAccounts = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, '参数验证失败', errors.array());
  }

  try {
    const {
      page = 1,
      pageSize = 20,
      status,
      gameName,
      sellerId,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      where.status = 'APPROVED';
    }

    if (gameName) {
      where.gameName = gameName;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = parseFloat(minPrice as string);
      }
      if (maxPrice !== undefined) {
        where.price.lte = parseFloat(maxPrice as string);
      }
    }

    const orderBy: any[] = [];

    if (sortBy === 'createdAt') {
      orderBy.push({ isTop: 'desc' });
      orderBy.push({ isHot: 'desc' });
    }
    orderBy.push({ [sortBy as string]: sortOrder });

    const [total, accounts] = await Promise.all([
      prisma.gameAccount.count({ where }),
      prisma.gameAccount.findMany({
        where,
        orderBy,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        include: {
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
          images: {
            where: { isMain: true },
            take: 1,
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / Number(pageSize));

    successResponse(
      res,
      accounts,
      undefined,
      {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages,
      }
    );
  } catch (error) {
    console.error('Get accounts error:', error);
    errorResponse(res, 500, '获取账号列表失败');
  }
};

export const createAccount = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, 400, '参数验证失败', errors.array());
  }

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const {
      title,
      description,
      gameName,
      gameServer,
      accountLevel,
      price,
      originalPrice,
    } = req.body;

    const account = await prisma.gameAccount.create({
      data: {
        title,
        description,
        gameName,
        gameServer,
        accountLevel,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        sellerId: req.user.id,
        status: 'PENDING_REVIEW' as AccountStatus,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    successResponse(res, account, '账号发布成功，等待审核');
  } catch (error) {
    console.error('Create account error:', error);
    errorResponse(res, 500, '发布账号失败');
  }
};

export const updateAccount = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const account = await prisma.gameAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return errorResponse(res, 404, '账号不存在');
    }

    if (account.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 403, '无权修改此账号');
    }

    const {
      title,
      description,
      gameName,
      gameServer,
      accountLevel,
      price,
      originalPrice,
    } = req.body;

    const updatedAccount = await prisma.gameAccount.update({
      where: { id },
      data: {
        title,
        description,
        gameName,
        gameServer,
        accountLevel,
        price: price !== undefined ? parseFloat(price) : undefined,
        originalPrice: originalPrice !== undefined ? parseFloat(originalPrice) : undefined,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    successResponse(res, updatedAccount, '账号更新成功');
  } catch (error) {
    console.error('Update account error:', error);
    errorResponse(res, 500, '更新账号失败');
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const account = await prisma.gameAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return errorResponse(res, 404, '账号不存在');
    }

    if (account.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 403, '无权删除此账号');
    }

    await prisma.gameAccount.update({
      where: { id },
      data: { status: 'REMOVED' as AccountStatus },
    });

    successResponse(res, null, '账号已删除');
  } catch (error) {
    console.error('Delete account error:', error);
    errorResponse(res, 500, '删除账号失败');
  }
};

export const reviewAccount = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return errorResponse(res, 400, '无效的审核状态');
  }

  try {
    const account = await prisma.gameAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return errorResponse(res, 404, '账号不存在');
    }

    const updatedAccount = await prisma.gameAccount.update({
      where: { id },
      data: {
        status: status as AccountStatus,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    successResponse(res, updatedAccount, `账号已${status === 'APPROVED' ? '通过' : '拒绝'}`);
  } catch (error) {
    console.error('Review account error:', error);
    errorResponse(res, 500, '审核失败');
  }
};

export const getMyAccounts = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return errorResponse(res, 401, '未登录');
  }

  try {
    const { status } = req.query;

    const where: any = {
      sellerId: req.user.id,
    };

    if (status) {
      where.status = status;
    }

    const accounts = await prisma.gameAccount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          where: { isMain: true },
          take: 1,
        },
        orders: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    successResponse(res, accounts);
  } catch (error) {
    console.error('Get my accounts error:', error);
    errorResponse(res, 500, '获取我的账号失败');
  }
};

export const getGameNames = async (req: AuthRequest, res: Response) => {
  try {
    const gameNames = await prisma.gameAccount.groupBy({
      by: ['gameName'],
      where: {
        status: 'APPROVED',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const result = gameNames.map((item) => ({
      name: item.gameName,
      count: item._count.id,
    }));

    successResponse(res, result);
  } catch (error) {
    console.error('Get game names error:', error);
    errorResponse(res, 500, '获取游戏列表失败');
  }
};
