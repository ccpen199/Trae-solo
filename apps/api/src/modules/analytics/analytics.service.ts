import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type { TrackEventDto, UserProfileQueryDto, PetProfileQueryDto, TagQueryDto } from './dto';

@Injectable()
export class AnalyticsService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async trackEvent(dto: TrackEventDto) {
    return this.prisma.userBehaviorLog.create({
      data: {
        userId: dto.userId,
        anonymousId: dto.anonymousId,
        eventType: dto.eventType,
        eventName: dto.eventName,
        properties: dto.properties as any,
        pageUrl: dto.pageUrl,
        pageTitle: dto.pageTitle,
        referrer: dto.referrer,
        userAgent: dto.userAgent,
        ip: dto.ip,
        location: dto.location,
        deviceType: dto.deviceType,
        os: dto.os,
        browser: dto.browser,
        sessionId: dto.sessionId,
        duration: dto.duration,
      },
    });
  }

  async getUserProfile(query: UserProfileQueryDto) {
    const where: Record<string, unknown> = { userId: query.userId };
    if (query.tagCategory) where.tagCategory = query.tagCategory;
    const tags = await this.prisma.userProfileTag.findMany({ where });
    const user = await this.prisma.user.findUnique({
      where: { id: query.userId },
      select: { id: true, nickname: true, avatar: true, role: true, membershipLevel: true },
    });
    return { user, tags };
  }

  async getPetProfile(query: PetProfileQueryDto) {
    const where: Record<string, unknown> = { petId: query.petId };
    if (query.tagCategory) where.tagCategory = query.tagCategory;
    const tags = await this.prisma.petProfileTag.findMany({ where });
    const pet = await this.prisma.petProfile.findUnique({
      where: { id: query.petId },
      select: { id: true, name: true, type: true, breed: true, avatar: true },
    });
    return { pet, tags };
  }

  async getUserTags(userId: string, query: TagQueryDto): Promise<PaginationResult<unknown>> {
    const where: Record<string, unknown> = { userId };
    if (query.tagCategory) where.tagCategory = query.tagCategory;
    const [total, items] = await Promise.all([
      this.prisma.userProfileTag.count({ where }),
      this.prisma.userProfileTag.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        orderBy: { weight: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, query.page, query.pageSize);
  }

  async getPetTags(petId: string, query: TagQueryDto): Promise<PaginationResult<unknown>> {
    const where: Record<string, unknown> = { petId };
    if (query.tagCategory) where.tagCategory = query.tagCategory;
    const [total, items] = await Promise.all([
      this.prisma.petProfileTag.count({ where }),
      this.prisma.petProfileTag.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        orderBy: { weight: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, query.page, query.pageSize);
  }
}
