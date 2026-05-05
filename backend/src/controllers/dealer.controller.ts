import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { ApiError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

type DealerFileType = 'RULES' | 'TRAINING' | 'DOCUMENT' | 'NEWSLETTER';

const fileCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileType: z.enum(['RULES', 'TRAINING', 'DOCUMENT', 'NEWSLETTER']),
  viewLevel: z.number().int().min(1).max(10).default(1),
});

const postCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  viewLevel: z.number().int().min(1).max(10).default(1),
  isPinned: z.boolean().default(false),
  isHighlight: z.boolean().default(false),
});

const replyCreateSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().uuid().optional(),
});

export const getFiles = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userLevel = req.user?.dealerLevel ?? 1;
    const fileType = req.query.type as DealerFileType | undefined;

    const files = await prisma.dealerFile.findMany({
      where: {
        viewLevel: { lte: userLevel },
        ...(fileType && { fileType }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, username: true, nickname: true },
        },
      },
    });

    res.json({ files, total: files.length });
  } catch (error) {
    next(error);
  }
};

export const getFileById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userLevel = req.user?.dealerLevel ?? 1;

    const file = await prisma.dealerFile.findUnique({
      where: { id },
      include: {
        uploader: {
          select: { id: true, username: true, nickname: true },
        },
      },
    });

    if (!file) {
      throw new ApiError('文件不存在', 404);
    }

    if (file.viewLevel > userLevel && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
      throw new ApiError('权限不足，无法访问此文件', 403);
    }

    res.json({ file });
  } catch (error) {
    next(error);
  }
};

export const createFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const body = fileCreateSchema.parse(req.body);

    const file = await prisma.dealerFile.create({
      data: {
        title: body.title,
        description: body.description || null,
        fileUrl: body.fileUrl,
        fileType: body.fileType as DealerFileType,
        viewLevel: body.viewLevel,
        uploaderId: req.user.id,
      },
      include: {
        uploader: {
          select: { id: true, username: true, nickname: true },
        },
      },
    });

    res.status(201).json({
      message: '文件创建成功',
      file,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError(error.errors[0]?.message || '参数验证失败', 400));
    }
    next(error);
  }
};

export const deleteFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const file = await prisma.dealerFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new ApiError('文件不存在', 404);
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN' && file.uploaderId !== req.user?.id) {
      throw new ApiError('权限不足，无法删除此文件', 403);
    }

    await prisma.dealerFile.delete({
      where: { id },
    });

    res.json({ message: '文件删除成功' });
  } catch (error) {
    next(error);
  }
};

export const getPosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userLevel = req.user?.dealerLevel ?? 1;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const whereClause = {
      viewLevel: { lte: userLevel },
    };

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where: whereClause,
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
        },
      }),
      prisma.forumPost.count({ where: whereClause }),
    ]);

    res.json({
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    next(error);
  }
};

export const getPostById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userLevel = req.user?.dealerLevel ?? 1;

    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
      },
    });

    if (!post) {
      throw new ApiError('帖子不存在', 404);
    }

    if (post.viewLevel > userLevel && req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
      throw new ApiError('权限不足，无法访问此帖子', 403);
    }

    await prisma.forumPost.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json({ post });
  } catch (error) {
    next(error);
  }
};

export const createPost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const body = postCreateSchema.parse(req.body);

    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';

    const post = await prisma.forumPost.create({
      data: {
        title: body.title,
        content: body.content,
        userId: req.user.id,
        viewLevel: body.viewLevel,
        isPinned: isAdmin ? body.isPinned : false,
        isHighlight: isAdmin ? body.isHighlight : false,
      },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      message: '帖子发布成功',
      post,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError(error.errors[0]?.message || '参数验证失败', 400));
    }
    next(error);
  }
};

export const updatePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const post = await prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new ApiError('帖子不存在', 404);
    }

    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && post.userId !== req.user.id) {
      throw new ApiError('权限不足，无法编辑此帖子', 403);
    }

    const { title, content, viewLevel, isPinned, isHighlight } = req.body;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN';

    const updatedPost = await prisma.forumPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(viewLevel !== undefined && { viewLevel }),
        ...(isAdmin && isPinned !== undefined && { isPinned }),
        ...(isAdmin && isHighlight !== undefined && { isHighlight }),
      },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
      },
    });

    res.json({
      message: '帖子更新成功',
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const post = await prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new ApiError('帖子不存在', 404);
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN' && post.userId !== req.user?.id) {
      throw new ApiError('权限不足，无法删除此帖子', 403);
    }

    await prisma.forumPost.delete({
      where: { id },
    });

    res.json({ message: '帖子删除成功' });
  } catch (error) {
    next(error);
  }
};

export const getPostReplies = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const replies = await prisma.forumReply.findMany({
      where: { postId: id, parentId: null },
      orderBy: { createdAt: 'asc' },
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
        },
      },
    });

    res.json({ replies, total: replies.length });
  } catch (error) {
    next(error);
  }
};

export const createReply = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new ApiError('未认证', 401);
    }

    const body = replyCreateSchema.parse(req.body);

    const post = await prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new ApiError('帖子不存在', 404);
    }

    const reply = await prisma.$transaction(async (tx) => {
      const newReply = await tx.forumReply.create({
        data: {
          content: body.content,
          postId: id,
          userId: req.user!.id,
          parentId: body.parentId || null,
        },
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
        },
      });

      if (!body.parentId) {
        await tx.forumPost.update({
          where: { id },
          data: { replies: { increment: 1 } },
        });
      }

      return newReply;
    });

    res.status(201).json({
      message: '回复发布成功',
      reply,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new ApiError(error.errors[0]?.message || '参数验证失败', 400));
    }
    next(error);
  }
};

export const deleteReply = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, replyId } = req.params;

    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
    });

    if (!reply) {
      throw new ApiError('回复不存在', 404);
    }

    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN' && reply.userId !== req.user?.id) {
      throw new ApiError('权限不足，无法删除此回复', 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.forumReply.delete({
        where: { id: replyId },
      });

      if (!reply.parentId) {
        await tx.forumPost.update({
          where: { id },
          data: { replies: { decrement: 1 } },
        });
      }
    });

    res.json({ message: '回复删除成功' });
  } catch (error) {
    next(error);
  }
};
