import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type { FollowDto, UnfollowDto, UpdateRelationshipDto, RelationshipQueryDto } from './dto';

@Injectable()
export class SocialService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async follow(userId: string, dto: FollowDto) {
    if (userId === dto.followingId) {
      throw new BadRequestException('不能关注自己');
    }
    const target = await this.prisma.user.findUnique({ where: { id: dto.followingId } });
    if (!target) {
      throw new NotFoundException('目标用户不存在');
    }
    const existing = await this.prisma.userRelationship.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: dto.followingId } },
    });
    if (existing) {
      if (existing.type === 'FOLLOW') {
        throw new BadRequestException('已经关注了该用户');
      }
      return this.prisma.userRelationship.update({
        where: { id: existing.id },
        data: { type: 'FOLLOW' },
      });
    }
    return this.prisma.userRelationship.create({
      data: { followerId: userId, followingId: dto.followingId, type: 'FOLLOW' },
    });
  }

  async unfollow(userId: string, dto: UnfollowDto) {
    const existing = await this.prisma.userRelationship.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: dto.followingId } },
    });
    if (!existing || existing.type !== 'FOLLOW') {
      throw new BadRequestException('未关注该用户');
    }
    await this.prisma.userRelationship.delete({ where: { id: existing.id } });
    return { success: true };
  }

  async getFollowers(userId: string, query: RelationshipQueryDto): Promise<PaginationResult<unknown>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const where: Record<string, unknown> = { followingId: userId, type: 'FOLLOW' };
    if (query.keyword) {
      where.follower = { nickname: { contains: query.keyword } };
    }
    const [total, items] = await Promise.all([
      this.prisma.userRelationship.count({ where }),
      this.prisma.userRelationship.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: { follower: { select: { id: true, nickname: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, page, pageSize);
  }

  async getFollowing(userId: string, query: RelationshipQueryDto): Promise<PaginationResult<unknown>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const where: Record<string, unknown> = { followerId: userId, type: 'FOLLOW' };
    if (query.keyword) {
      where.following = { nickname: { contains: query.keyword } };
    }
    const [total, items] = await Promise.all([
      this.prisma.userRelationship.count({ where }),
      this.prisma.userRelationship.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: { following: { select: { id: true, nickname: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, page, pageSize);
  }

  async getFriends(userId: string, query: RelationshipQueryDto): Promise<PaginationResult<unknown>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const followedByMe = await this.prisma.userRelationship.findMany({
      where: { followerId: userId, type: 'FOLLOW' },
      select: { followingId: true },
    });
    const followingIds = followedByMe.map(r => r.followingId);
    if (followingIds.length === 0) {
      return buildPaginationResult([], 0, page, pageSize);
    }
    const where: Record<string, unknown> = {
      followerId: { in: followingIds },
      followingId: userId,
      type: 'FOLLOW',
    };
    if (query.keyword) {
      where.follower = { nickname: { contains: query.keyword } };
    }
    const [total, items] = await Promise.all([
      this.prisma.userRelationship.count({ where }),
      this.prisma.userRelationship.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: { follower: { select: { id: true, nickname: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, page, pageSize);
  }

  async updateRelationship(userId: string, targetId: string, dto: UpdateRelationshipDto) {
    const existing = await this.prisma.userRelationship.findUnique({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
    });
    if (!existing) {
      throw new NotFoundException('关系不存在');
    }
    return this.prisma.userRelationship.update({
      where: { id: existing.id },
      data: { type: dto.type, remark: dto.remark },
    });
  }
}
