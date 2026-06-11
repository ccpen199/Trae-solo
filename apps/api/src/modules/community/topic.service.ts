import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient, Topic } from '@pet/db';
import { DatabaseService } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared';
import type { PaginationResult } from '@pet/shared';
import { CreateTopicDto, UpdateTopicDto, TopicQueryDto } from './dto/topic.dto';

@Injectable()
export class TopicService {
  private readonly prisma: PrismaClient;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.prisma = DatabaseService.getClient();
  }

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    const existing = await this.prisma.topic.findUnique({
      where: { slug: createTopicDto.slug },
    });

    if (existing) {
      throw new ConflictException('话题 slug 已存在');
    }

    return this.prisma.topic.create({
      data: createTopicDto,
    });
  }

  async findAll(query: TopicQueryDto): Promise<PaginationResult<Topic>> {
    const { page, pageSize, keyword, category, isHot, isOfficial, sortBy, sortOrder } = query;

    const where: any = {
      status: true,
    };

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isHot !== undefined) {
      where.isHot = isHot;
    }

    if (isOfficial !== undefined) {
      where.isOfficial = isOfficial;
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.sortOrder = 'asc';
      orderBy.followerCount = 'desc';
    }

    const [total, items] = await Promise.all([
      this.prisma.topic.count({ where }),
      this.prisma.topic.findMany({
        where,
        orderBy,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
      }),
    ]);

    return buildPaginationResult(items, total, page, pageSize);
  }

  async findHotTopics(limit: number = 10): Promise<Topic[]> {
    return this.prisma.topic.findMany({
      where: { status: true, isHot: true },
      orderBy: [
        { followerCount: 'desc' },
        { postCount: 'desc' },
      ],
      take: limit,
    });
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException('话题不存在');
    }

    return topic;
  }

  async findBySlug(slug: string): Promise<Topic> {
    const topic = await this.prisma.topic.findUnique({
      where: { slug },
    });

    if (!topic) {
      throw new NotFoundException('话题不存在');
    }

    return topic;
  }

  async update(id: string, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    await this.findOne(id);

    if (updateTopicDto.slug) {
      const existing = await this.prisma.topic.findUnique({
        where: { slug: updateTopicDto.slug },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('话题 slug 已存在');
      }
    }

    return this.prisma.topic.update({
      where: { id },
      data: updateTopicDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.topic.delete({ where: { id } });
  }

  async followTopic(topicId: string, userId: string): Promise<void> {
    await this.findOne(topicId);

    const existing = await this.prisma.topicFollower.findUnique({
      where: {
        topicId_userId: {
          topicId,
          userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('已关注该话题');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.topicFollower.create({
        data: { topicId, userId },
      });

      await tx.topic.update({
        where: { id: topicId },
        data: { followerCount: { increment: 1 } },
      });
    });

    this.eventEmitter.emit('topic.followed', { topicId, userId });
  }

  async unfollowTopic(topicId: string, userId: string): Promise<void> {
    await this.findOne(topicId);

    const existing = await this.prisma.topicFollower.findUnique({
      where: {
        topicId_userId: {
          topicId,
          userId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('未关注该话题');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.topicFollower.delete({
        where: {
          topicId_userId: {
            topicId,
            userId,
          },
        },
      });

      await tx.topic.update({
        where: { id: topicId },
        data: { followerCount: { decrement: 1 } },
      });
    });

    this.eventEmitter.emit('topic.unfollowed', { topicId, userId });
  }

  async isFollowing(topicId: string, userId: string): Promise<boolean> {
    const follow = await this.prisma.topicFollower.findUnique({
      where: {
        topicId_userId: {
          topicId,
          userId,
        },
      },
    });

    return !!follow;
  }

  async getUserFollowedTopics(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginationResult<Topic>> {
    const [total, follows] = await Promise.all([
      this.prisma.topicFollower.count({ where: { userId } }),
      this.prisma.topicFollower.findMany({
        where: { userId },
        include: { topic: true },
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const topics = follows.map((f) => f.topic);
    return buildPaginationResult(topics, total, page, pageSize);
  }
}
