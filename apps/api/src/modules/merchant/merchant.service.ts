import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, MerchantStatus } from '@pet/db';
import { buildPaginationResult, calculateOffset } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type { ApplyMerchantDto, ApproveMerchantDto, MerchantQueryDto } from './dto';

@Injectable()
export class MerchantService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async apply(userId: string, dto: ApplyMerchantDto) {
    const existing = await this.prisma.merchant.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException('已提交过商家入驻申请');
    }
    const merchant = await this.prisma.merchant.create({
      data: {
        userId,
        name: dto.name,
        businessLicense: dto.businessLicense,
        businessLicenseImage: dto.businessLicenseImage,
        legalPersonName: dto.legalPersonName,
        legalPersonIdCard: dto.legalPersonIdCard,
        legalPersonIdCardImage: dto.legalPersonIdCardImage,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        category: dto.category,
        brandName: dto.brandName,
        logo: dto.logo,
        description: dto.description,
        address: dto.address,
        status: MerchantStatus.PENDING,
      },
    });
    return merchant;
  }

  async approve(dto: ApproveMerchantDto) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: dto.merchantId } });
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }
    if (merchant.status !== MerchantStatus.PENDING) {
      throw new BadRequestException('只能审核待审核状态的商家');
    }
    if (dto.status === MerchantStatus.APPROVED) {
      return this.prisma.merchant.update({
        where: { id: dto.merchantId },
        data: { status: MerchantStatus.APPROVED, verifiedAt: new Date() },
      });
    }
    if (dto.status === MerchantStatus.REJECTED) {
      if (!dto.rejectReason) {
        throw new BadRequestException('拒绝时必须填写原因');
      }
      return this.prisma.merchant.update({
        where: { id: dto.merchantId },
        data: { status: MerchantStatus.REJECTED, rejectReason: dto.rejectReason },
      });
    }
    throw new BadRequestException('无效的审核状态');
  }

  async findPaginated(query: MerchantQueryDto): Promise<PaginationResult<unknown>> {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { brandName: { contains: query.keyword } },
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.merchant.count({ where }),
      this.prisma.merchant.findMany({
        where,
        skip: calculateOffset(page, pageSize),
        take: pageSize,
        include: {
          user: { select: { id: true, nickname: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, page, pageSize);
  }

  async findById(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true, avatar: true, phone: true } },
      },
    });
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }
    return merchant;
  }
}
