import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PolicyCategory, Department } from '@prisma/client';
import { CreatePolicyDto, UpdatePolicyDto, PolicyQueryDto } from './dto/policy.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class PolicyService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async create(dto: CreatePolicyDto) {
    this.logger.log(`创建政策文件: ${dto.title}`, 'PolicyService');
    const structuredData = this.extractStructuredData(dto.content, dto.keywords || []);
    return this.prisma.policyDocument.create({
      data: {
        ...dto,
        keywords: dto.keywords || [],
        structuredData,
      },
    });
  }

  async findAll(query: PolicyQueryDto) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { documentNo: { contains: query.keyword } },
        { summary: { contains: query.keyword } },
        { keywords: { has: query.keyword } },
      ];
    }
    if (query.category) where.category = query.category as PolicyCategory;
    if (query.issuingDept) where.issuingDept = query.issuingDept as Department;
    if (query.status) where.status = query.status;

    const [list, total] = await Promise.all([
      this.prisma.policyDocument.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.policyDocument.count({ where }),
    ]);

    return {
      list,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(id: string) {
    const doc = await this.prisma.policyDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('政策文件不存在');
    await this.prisma.policyDocument.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return doc;
  }

  async update(id: string, dto: UpdatePolicyDto) {
    const doc = await this.prisma.policyDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('政策文件不存在');
    return this.prisma.policyDocument.update({
      where: { id },
      data: { ...dto, keywords: dto.keywords || doc.keywords },
    });
  }

  async markTrained(id: string) {
    return this.prisma.policyDocument.update({
      where: { id },
      data: { aiTrained: true, trainedAt: new Date() },
    });
  }

  async remove(id: string) {
    return this.prisma.policyDocument.delete({ where: { id } });
  }

  private extractStructuredData(content: string, keywords: string[]) {
    const paragraphs = content.split(/\n+/).filter((p) => p.trim().length > 20);
    const summary = paragraphs.slice(0, 3).join(' ').substring(0, 500);
    return {
      wordCount: content.length,
      paragraphCount: paragraphs.length,
      autoSummary: summary,
      extractedKeywords: keywords,
      categories: this.classifyContent(content),
    };
  }

  private classifyContent(content: string): string[] {
    const categories: string[] = [];
    if (content.includes('补贴') || content.includes('扶持')) categories.push('补贴扶持');
    if (content.includes('审批') || content.includes('办理')) categories.push('行政审批');
    if (content.includes('社保') || content.includes('养老')) categories.push('社会保障');
    if (content.includes('教育') || content.includes('学校')) categories.push('教育服务');
    if (content.includes('医疗') || content.includes('卫生')) categories.push('医疗卫生');
    if (content.includes('住房') || content.includes('保障')) categories.push('住房保障');
    if (categories.length === 0) categories.push('通用政策');
    return categories;
  }
}
