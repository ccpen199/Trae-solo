import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/error';
import { AuthRequest, UserRole } from '../middleware/auth';

type NewsStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type NewsType = 'TEXT' | 'IMAGE' | 'VIDEO';

const createNewsSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  summary: z.string().max(1000).optional(),
  content: z.string().min(1),
  coverImage: z.string().optional(),
  videoUrl: z.string().optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO']).default('TEXT'),
  categoryId: z.string().uuid(),
  isTop: z.boolean().default(false),
  isHot: z.boolean().default(false),
});

const updateNewsSchema = createNewsSchema.partial();

export const getNewsList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      categoryCode,
      categoryId,
      type,
      keyword,
      page = 1,
      limit = 10,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
    };

    if (categoryCode) {
      where.category = {
        code: categoryCode,
      };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type) {
      where.type = type as NewsType;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string } },
        { summary: { contains: keyword as string } },
        { content: { contains: keyword as string } },
      ];
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take,
        include: {
          category: {
            select: { id: true, name: true, code: true },
          },
          author: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: [
          { isTop: 'desc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.news.count({ where }),
    ]);

    res.json({
      data: news,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getNewsDetail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
        author: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, username: true, nickname: true, avatar: true },
            },
            replies: {
              include: {
                user: {
                  select: { id: true, username: true, nickname: true, avatar: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!news) {
      throw new ApiError('新闻不存在', 404);
    }

    if (news.status !== 'PUBLISHED' && !req.user) {
      throw new ApiError('新闻不存在', 404);
    }

    if (
      news.status !== 'PUBLISHED' &&
      req.user?.role !== 'ADMIN' &&
      req.user?.role !== 'SUPER_ADMIN'
    ) {
      throw new ApiError('新闻不存在', 404);
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    const userAgent = req.headers['user-agent'] || '';

    await prisma.$transaction([
      prisma.news.update({
        where: { id },
        data: { views: { increment: 1 } },
      }),
      prisma.newsViewStat.create({
        data: {
          newsId: id,
          userId: req.user?.id || null,
          ipAddress: Array.isArray(ip) ? ip[0] : ip,
          userAgent,
        },
      }),
    ]);

    res.json({ data: { ...news, views: news.views + 1 } });
  } catch (error) {
    next(error);
  }
};

export const createNews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const body = createNewsSchema.parse(req.body);

    const category = await prisma.newsCategory.findUnique({
      where: { id: body.categoryId },
    });

    if (!category) {
      throw new ApiError('新闻分类不存在', 400);
    }

    const news = await prisma.news.create({
      data: {
        title: body.title,
        subtitle: body.subtitle || null,
        summary: body.summary || null,
        content: body.content,
        coverImage: body.coverImage || null,
        videoUrl: body.videoUrl || null,
        type: body.type as NewsType,
        categoryId: body.categoryId,
        authorId: req.user.id,
        isTop: body.isTop,
        isHot: body.isHot,
        status: 'DRAFT',
      },
      include: {
        category: true,
        author: {
          select: { id: true, username: true, nickname: true },
        },
      },
    });

    res.status(201).json({
      message: '新闻创建成功',
      data: news,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError(error.errors[0]?.message || '参数验证失败', 400));
    }
    next(error);
  }
};

export const updateNews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { id } = req.params;
    const body = updateNewsSchema.parse(req.body);

    const existingNews = await prisma.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      throw new ApiError('新闻不存在', 404);
    }

    if (
      existingNews.authorId !== req.user.id &&
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SUPER_ADMIN'
    ) {
      throw new ApiError('无权限编辑此新闻', 403);
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.coverImage !== undefined) updateData.coverImage = body.coverImage;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.isTop !== undefined) updateData.isTop = body.isTop;
    if (body.isHot !== undefined) updateData.isHot = body.isHot;

    const news = await prisma.news.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        author: {
          select: { id: true, username: true, nickname: true },
        },
      },
    });

    res.json({
      message: '新闻更新成功',
      data: news,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError(error.errors[0]?.message || '参数验证失败', 400));
    }
    next(error);
  }
};

export const publishNews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { id } = req.params;

    const news = await prisma.news.findUnique({
      where: { id },
    });

    if (!news) {
      throw new ApiError('新闻不存在', 404);
    }

    if (
      news.authorId !== req.user.id &&
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'SUPER_ADMIN'
    ) {
      throw new ApiError('无权限发布此新闻', 403);
    }

    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    res.json({
      message: '新闻发布成功',
      data: updatedNews,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.newsCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            news: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    });

    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { name, code, description, sortOrder, parentId } = req.body;

    if (!name || !code) {
      throw new ApiError('分类名称和代码不能为空', 400);
    }

    const category = await prisma.newsCategory.create({
      data: {
        name,
        code,
        description: description || null,
        sortOrder: sortOrder || 0,
        parentId: parentId || null,
      },
    });

    res.status(201).json({
      message: '分类创建成功',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const { newsId } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim().length === 0) {
      throw new ApiError('评论内容不能为空', 400);
    }

    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      throw new ApiError('新闻不存在', 404);
    }

    if (parentId) {
      const parentComment = await prisma.newsComment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.newsId !== newsId) {
        throw new ApiError('父评论不存在', 400);
      }
    }

    const comment = await prisma.newsComment.create({
      data: {
        content: content.trim(),
        newsId,
        userId: req.user.id,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      message: '评论发表成功',
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};
