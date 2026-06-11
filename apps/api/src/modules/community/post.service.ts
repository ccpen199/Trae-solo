import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient, Post, ContentAuditStatus, PostStatus } from '@pet/db';
import { DatabaseService } from '@pet/db';
import { buildPaginationResult, calculateOffset, extractKeywords } from '@pet/shared';
import type { PaginationResult } from '@pet/shared';
import { CreatePostDto, UpdatePostDto, PostQueryDto, AuditPostDto } from './dto/post.dto';

@Injectable()
export class PostService {
  private readonly prisma: PrismaClient;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.prisma = DatabaseService.getClient();
  }

  async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const { topicIds, ...rest } = createPostDto;

    const topicConnect = topicIds && topicIds.length > 0
      ? topicIds.map((id) => ({ id }))
      : undefined;

    const post = await this.prisma.post.create({
      data: {
        ...rest,
        userId,
        tags: extractKeywords(createPostDto.content || ''),
        topics: topicConnect ? { connect: topicConnect } : undefined,
      },
      include: {
        topics: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    if (topicIds && topicIds.length > 0) {
      await this.prisma.topic.updateMany({
        where: { id: { in: topicIds } },
        data: { postCount: { increment: 1 } },
      });
    }

    this.eventEmitter.emit('post.created', { post });

    return post;
  }

  async findAll(query: PostQueryDto): Promise<PaginationResult<Post>> {
    const { page, pageSize, keyword, type, status, userId, topicId, isTop, isHot, isEssence, sortBy, sortOrder } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { tags: { hasSome: keyword.split(' ') } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    } else {
      where.status = { in: [PostStatus.PUBLISHED, PostStatus.PENDING_REVIEW] };
    }

    if (userId) {
      where.userId = userId;
    }

    if (topicId) {
      where.topics = {
        some: { id: topicId },
      };
    }

    if (isTop !== undefined) {
      where.isTop = isTop;
    }

    if (isHot !== undefined) {
      where.isHot = isHot;
    }

    if (isEssence !== undefined) {
      where.isEssence = isEssence;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.isTop = 'desc';
      orderBy.createdAt = 'desc';
    }

    const [total, items] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        orderBy,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: {
          topics: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user: {
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

  async findEssencePosts(page: number = 1, pageSize: number = 20): Promise<PaginationResult<Post>> {
    return this.findAll({
      page,
      pageSize,
      isEssence: true,
      status: PostStatus.PUBLISHED,
    } as PostQueryDto);
  }

  async findTopPosts(page: number = 1, pageSize: number = 20): Promise<PaginationResult<Post>> {
    return this.findAll({
      page,
      pageSize,
      isTop: true,
      status: PostStatus.PUBLISHED,
    } as PostQueryDto);
  }

  async findHotPosts(limit: number = 10): Promise<Post[]> {
    return this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        isHot: true,
      },
      orderBy: [
        { likeCount: 'desc' },
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        topics: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('帖子不存在');
    }

    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  async update(id: string, userId: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);

    if (post.userId !== userId) {
      throw new ForbiddenException('无权限修改此帖子');
    }

    const { topicIds, ...rest } = updatePostDto;

    let topicData: any = {};
    if (topicIds) {
      topicData = {
        topics: {
          set: topicIds.map((tid) => ({ id: tid })),
        },
      };
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        ...rest,
        ...topicData,
        tags: rest.content ? extractKeywords(rest.content) : undefined,
      },
      include: {
        topics: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    this.eventEmitter.emit('post.updated', { post: updatedPost });

    return updatedPost;
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.findOne(id);

    if (post.userId !== userId) {
      throw new ForbiddenException('无权限删除此帖子');
    }

    await this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.REMOVED },
    });

    if (post.topicIds && post.topicIds.length > 0) {
      await this.prisma.topic.updateMany({
        where: { id: { in: post.topicIds } },
        data: { postCount: { decrement: 1 } },
      });
    }

    this.eventEmitter.emit('post.deleted', { postId: id, userId });
  }

  async likePost(postId: string, userId: string): Promise<void> {
    await this.findOne(postId);

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId: postId,
          targetType: 'post',
        },
      },
    });

    if (existing) {
      throw new ForbiddenException('已点赞该帖子');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: {
          userId,
          targetId: postId,
          targetType: 'post',
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      });
    });

    this.eventEmitter.emit('post.liked', { postId, userId });
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await this.findOne(postId);

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId: postId,
          targetType: 'post',
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('未点赞该帖子');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.like.delete({
        where: {
          userId_targetId_targetType: {
            userId,
            targetId: postId,
            targetType: 'post',
          },
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      });
    });

    this.eventEmitter.emit('post.unliked', { postId, userId });
  }

  async auditPost(postId: string, auditPostDto: AuditPostDto, auditorId?: string): Promise<Post> {
    const post = await this.findOne(postId);

    const { status, reason } = auditPostDto;

    const updatedPost = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.post.update({
        where: { id: postId },
        data: {
          auditStatus: status as ContentAuditStatus,
          auditReason: reason,
          status: status === 'APPROVED' ? PostStatus.PUBLISHED : post.status,
        },
        include: {
          topics: true,
          user: {
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
          contentId: postId,
          contentType: 'post',
          auditorId,
          status: status as ContentAuditStatus,
          reason,
          operation: status === 'APPROVED' ? 'approve' : status === 'REJECTED' ? 'reject' : 'flag',
        },
      });

      return updated;
    });

    this.eventEmitter.emit('post.audited', { post: updatedPost, auditorId });

    return updatedPost;
  }

  async setTop(postId: string, isTop: boolean): Promise<Post> {
    await this.findOne(postId);

    return this.prisma.post.update({
      where: { id: postId },
      data: { isTop },
      include: {
        topics: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  async setEssence(postId: string, isEssence: boolean): Promise<Post> {
    await this.findOne(postId);

    return this.prisma.post.update({
      where: { id: postId },
      data: { isEssence },
      include: {
        topics: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });
  }

  calculateHotScore(post: Post): number {
    const now = Date.now();
    const createdAt = new Date(post.createdAt).getTime();
    const ageInHours = (now - createdAt) / (1000 * 60 * 60);

    const likeWeight = 4;
    const commentWeight = 3;
    const viewWeight = 1;
    const shareWeight = 2;

    const score =
      post.likeCount * likeWeight +
      post.commentCount * commentWeight +
      post.viewCount * viewWeight +
      post.shareCount * shareWeight;

    const gravity = 1.8;
    const decay = Math.pow(ageInHours + 2, gravity);

    return score / decay;
  }

  async updateHotStatus(postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return;

    const hotScore = this.calculateHotScore(post);
    const isHot = hotScore > 100;

    await this.prisma.post.update({
      where: { id: postId },
      data: { isHot },
    });
  }

  async isLiked(postId: string, userId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId: postId,
          targetType: 'post',
        },
      },
    });

    return !!like;
  }
}
