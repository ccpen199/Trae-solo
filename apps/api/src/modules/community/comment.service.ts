import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient, Comment, ContentAuditStatus } from '@pet/db';
import { DatabaseService } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared';
import type { PaginationResult } from '@pet/shared';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  private readonly prisma: PrismaClient;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.prisma = DatabaseService.getClient();
  }

  async create(userId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const { postId, parentId, replyToUserId, ...rest } = createCommentDto;

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          ...rest,
          postId,
          userId,
          parentId,
          replyToUserId,
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          replyToUser: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    this.eventEmitter.emit('comment.created', { comment });

    return comment;
  }

  async findAll(query: CommentQueryDto): Promise<PaginationResult<Comment>> {
    const { page, pageSize, postId, parentId, sortOrder } = query;

    const where: any = {
      postId,
      status: 'normal',
    };

    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }

    const [total, items] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: sortOrder || 'desc' },
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          replyToUser: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          children: {
            take: 3,
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
              replyToUser: {
                select: {
                  id: true,
                  nickname: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  }

  async findReplies(commentId: string, page: number = 1, pageSize: number = 20): Promise<PaginationResult<Comment>> {
    const where: any = {
      parentId: commentId,
      status: 'normal',
    };

    const [total, items] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          replyToUser: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        replyToUser: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    return comment;
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);

    if (comment.userId !== userId) {
      throw new ForbiddenException('无权限修改此评论');
    }

    return this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        replyToUser: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);

    if (comment.userId !== userId) {
      throw new ForbiddenException('无权限删除此评论');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id },
        data: { status: 'removed' },
      });

      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      });
    });

    this.eventEmitter.emit('comment.deleted', { commentId: id, userId });
  }

  async likeComment(commentId: string, userId: string): Promise<void> {
    await this.findOne(commentId);

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId: commentId,
          targetType: 'comment',
        },
      },
    });

    if (existing) {
      throw new ForbiddenException('已点赞该评论');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: {
          userId,
          targetId: commentId,
          targetType: 'comment',
        },
      });

      await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
      });
    });

    this.eventEmitter.emit('comment.liked', { commentId, userId });
  }

  async unlikeComment(commentId: string, userId: string): Promise<void> {
    await this.findOne(commentId);

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId: commentId,
          targetType: 'comment',
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('未点赞该评论');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.delete({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: commentId,
            targetType: 'comment',
          },
        },
      });

      await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
      });
    });

    this.eventEmitter.emit('comment.unliked', { commentId, userId });
  }

  async isLiked(commentId: string, userId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId: commentId,
          targetType: 'comment',
        },
      },
    });

    return !!like;
  }

  async auditComment(
    commentId: string,
    status: ContentAuditStatus,
    reason?: string,
    auditorId?: string,
  ): Promise<Comment> {
    const comment = await this.findOne(commentId);

    const updatedComment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.comment.update({
        where: { id: commentId },
        data: {
          isAudited: true,
          status: status === ContentAuditStatus.APPROVED ? 'normal' : 'hidden',
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          replyToUser: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
      });

      await tx.contentAuditLog.create({
        data: {
          contentId: commentId,
          contentType: 'comment',
          auditorId,
          status,
          reason,
          operation: status === ContentAuditStatus.APPROVED ? 'approve' : 'reject',
        },
      });

      return updated;
    });

    this.eventEmitter.emit('comment.audited', { comment: updatedComment, auditorId });

    return updatedComment;
  }
}
