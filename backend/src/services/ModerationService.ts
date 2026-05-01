import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { contentRankingEngine } from './engines/ContentRankingEngine';
import { reputationGrowthEngine } from './engines/ReputationGrowthEngine';
import { interactionStatsEngine } from './engines/InteractionStatsEngine';
import { autoModEngine } from './engines/AutoModEngine';
import { CommentStatus, PostStatus, UserRole } from '@prisma/client';

interface CreateCommentData {
  postId: string;
  content: string;
  parentId?: string;
  userId: string;
}

interface UpdateCommentData {
  content: string;
}

export class CommentService {
  async createComment(data: CreateCommentData, ipAddress?: string) {
    const modResult = await autoModEngine.checkContent(data.content, 'comment');
    
    if (modResult.action === 'reject') {
      throw new Error('评论包含违规内容，无法发布');
    }

    const post = await prisma.post.findUnique({
      where: { id: data.postId, status: PostStatus.PUBLISHED },
      select: { id: true, authorId: true, title: true }
    });

    if (!post) {
      throw new Error('帖子不存在或已被删除');
    }

    let parentComment: any = null;
    if (data.parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId, status: CommentStatus.PUBLISHED },
        select: { id: true, authorId: true, postId: true, parentId: true }
      });

      if (!parentComment) {
        throw new Error('回复的评论不存在');
      }

      if (parentComment.postId !== data.postId) {
        throw new Error('评论与帖子不匹配');
      }
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          postId: data.postId,
          authorId: data.userId,
          parentId: data.parentId || null,
          content: data.content,
          status: CommentStatus.PUBLISHED
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        }
      });

      await tx.user.update({
        where: { id: data.userId },
        data: { totalComments: { increment: 1 } }
      });

      await tx.post.update({
        where: { id: data.postId },
        data: { commentCount: { increment: 1 } }
      });

      return newComment;
    });

    await Promise.all([
      contentRankingEngine.handleEvent({
        type: 'comment_added',
        postId: data.postId,
        userId: data.userId
      }),
      reputationGrowthEngine.handleEvent({
        type: 'comment_created',
        userId: data.userId,
        relatedId: comment.id
      }),
      interactionStatsEngine.recordInteraction({
        type: 'post_comment',
        userId: data.userId,
        targetId: data.postId,
        targetType: 'post'
      })
    ]);

    if (post.authorId !== data.userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'new_comment',
          title: '收到新评论',
          content: `${comment.author.username} 评论了您的帖子：${post.title.substring(0, 20)}`,
          relatedPostId: data.postId,
          relatedUserId: data.userId
        }
      });
    }

    if (parentComment && parentComment.authorId !== data.userId && parentComment.authorId !== post.authorId) {
      await prisma.notification.create({
        data: {
          userId: parentComment.authorId,
          type: 'new_reply',
          title: '收到新回复',
          content: `${comment.author.username} 回复了您的评论`,
          relatedPostId: data.postId,
          relatedUserId: data.userId
        }
      });
    }

    return {
      ...comment,
      moderation: modResult.action === 'review' ? {
        status: 'pending_review',
        message: '评论已发布，但需要人工审核'
      } : null
    };
  }

  async getPostComments(postId: string, userId?: string, limit: number = 20, offset: number = 0) {
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: CommentStatus.PUBLISHED,
        parentId: null
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            level: true
          }
        },
        children: {
          where: { status: CommentStatus.PUBLISHED },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                level: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit
    });

    return comments;
  }

  async toggleLike(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId, status: CommentStatus.PUBLISHED },
      select: { id: true, authorId: true, postId: true }
    });

    if (!comment) {
      throw new Error('评论不存在或已被删除');
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } }
    });

    if (existingLike) {
      await prisma.$transaction(async (tx) => {
        await tx.commentLike.delete({
          where: { commentId_userId: { commentId, userId } }
        });

        await tx.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } }
        });
      });

      return { liked: false, likeCount: -1 };
    }

    await prisma.$transaction(async (tx) => {
      await tx.commentLike.create({
        data: {
          commentId,
          userId
        }
      });

      await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } }
      });
    });

    await Promise.all([
      contentRankingEngine.handleEvent({
        type: 'like_added',
        postId: comment.postId,
        userId
      }),
      interactionStatsEngine.recordInteraction({
        type: 'comment_like',
        userId,
        targetId: commentId,
        targetType: 'comment'
      })
    ]);

    if (comment.authorId !== userId) {
      await reputationGrowthEngine.handleEvent({
        type: 'like_received',
        userId: comment.authorId,
        relatedId: commentId
      });
    }

    return { liked: true, likeCount: 1 };
  }

  async deleteComment(commentId: string, userId: string, userRole: UserRole) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: { select: { id: true, authorId: true } }
      }
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    const isOwner = comment.authorId === userId;
    const isPostOwner = comment.post?.authorId === userId;
    const isModerator = userRole === UserRole.MODERATOR || userRole === UserRole.AUDITOR || userRole === UserRole.ADMIN;

    if (!isOwner && !isPostOwner && !isModerator) {
      throw new Error('权限不足，无法删除此评论');
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: {
          status: CommentStatus.DELETED,
          deletedAt: new Date(),
          deletedBy: userId
        }
      });

      await tx.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } }
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'delete_comment',
          targetType: 'comment',
          targetId: commentId,
          oldValue: {
            content: comment.content,
            authorId: comment.authorId
          }
        }
      });
    });

    await Promise.all([
      contentRankingEngine.handleEvent({
        type: 'comment_removed',
        postId: comment.postId,
        userId
      }),
      interactionStatsEngine.recordModerationAction('delete_comment', 'comment', commentId)
    ]);

    return { success: true };
  }

  async getCommentById(commentId: string) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });
  }
}

export const commentService = new CommentService();
