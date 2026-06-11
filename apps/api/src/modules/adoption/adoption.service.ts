import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, AdoptionStatus } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type { CreateAdoptionPostDto, ApplyAdoptionDto, ReviewAdoptionDto, AdoptionQueryDto } from './dto';

@Injectable()
export class AdoptionService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createPost(userId: string, dto: CreateAdoptionPostDto) {
    return this.prisma.adoptionPost.create({
      data: {
        userId,
        petType: dto.petType as any,
        petName: dto.petName,
        petAge: dto.petAge as any,
        petGender: dto.petGender as any,
        breed: dto.breed,
        vaccinated: dto.vaccinated ?? false,
        neutered: dto.neutered ?? false,
        healthCondition: dto.healthCondition,
        location: dto.location,
        adoptionType: dto.adoptionType,
        adoptionFee: dto.adoptionFee as any,
        requirements: dto.requirements,
        contactInfo: dto.contactInfo,
        status: AdoptionStatus.OPEN,
      },
    });
  }

  async findPaginated(query: AdoptionQueryDto): Promise<PaginationResult<unknown>> {
    const where: Record<string, unknown> = {};
    if (query.petType) where.petType = query.petType;
    if (query.status) where.status = query.status;
    if (query.location) where.location = { contains: query.location };
    if (query.keyword) {
      where.OR = [
        { petName: { contains: query.keyword } },
        { breed: { contains: query.keyword } },
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.adoptionPost.count({ where }),
      this.prisma.adoptionPost.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, query.page, query.pageSize);
  }

  async findById(id: string) {
    const post = await this.prisma.adoptionPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        applications: {
          include: {
            user: { select: { id: true, nickname: true, avatar: true } },
          },
        },
      },
    });
    if (!post) {
      throw new NotFoundException('领养信息不存在');
    }
    return post;
  }

  async apply(userId: string, dto: ApplyAdoptionDto) {
    const post = await this.prisma.adoptionPost.findUnique({
      where: { id: dto.adoptionPostId },
    });
    if (!post) {
      throw new NotFoundException('领养信息不存在');
    }
    if (post.status !== AdoptionStatus.OPEN) {
      throw new BadRequestException('该领养信息已关闭');
    }
    if (post.userId === userId) {
      throw new BadRequestException('不能申请自己发布的领养');
    }
    const existing = await this.prisma.adoptionApplication.findFirst({
      where: { adoptionPostId: dto.adoptionPostId, userId },
    });
    if (existing) {
      throw new BadRequestException('已申请过该领养');
    }
    const application = await this.prisma.adoptionApplication.create({
      data: {
        adoptionPostId: dto.adoptionPostId,
        userId,
        experience: dto.experience,
        livingCondition: dto.livingCondition,
        familyMembers: dto.familyMembers,
        hasOtherPets: dto.hasOtherPets,
        otherPetsInfo: dto.otherPetsInfo,
        monthlyBudget: dto.monthlyBudget as any,
        reason: dto.reason,
        contactInfo: dto.contactInfo,
        status: 'pending',
      },
    });
    await this.prisma.adoptionPost.update({
      where: { id: dto.adoptionPostId },
      data: { applicantCount: { increment: 1 } },
    });
    return application;
  }

  async review(reviewerId: string, dto: ReviewAdoptionDto) {
    const application = await this.prisma.adoptionApplication.findUnique({
      where: { id: dto.applicationId },
    });
    if (!application) {
      throw new NotFoundException('申请不存在');
    }
    const post = await this.prisma.adoptionPost.findUnique({
      where: { id: application.adoptionPostId },
    });
    if (!post) {
      throw new NotFoundException('领养信息不存在');
    }
    if (post.userId !== reviewerId) {
      throw new ForbiddenException('无权审核该申请');
    }
    if (dto.status === 'approved') {
      await this.prisma.$transaction(async (tx) => {
        await tx.adoptionApplication.update({
          where: { id: dto.applicationId },
          data: {
            status: 'approved',
            reviewedAt: new Date(),
            reviewerId,
            reviewReason: dto.reviewReason,
          },
        });
        await tx.adoptionPost.update({
          where: { id: application.adoptionPostId },
          data: {
            status: AdoptionStatus.ADOPTED,
            approvedApplicantId: application.userId,
            closedAt: new Date(),
          },
        });
      });
    } else {
      await this.prisma.adoptionApplication.update({
        where: { id: dto.applicationId },
        data: {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewerId,
          reviewReason: dto.reviewReason,
        },
      });
    }
    return { success: true };
  }
}
