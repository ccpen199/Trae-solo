import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Content } from './entities/content.entity';
import { ContentType, PublishStatus } from '../../common/types';
import { Site } from '../../common/entities/base.entity';
import { Category } from '../categories/entities/category.entity';
import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsObject, IsUUID, IsDateString, IsArray } from 'class-validator';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  subTitle?: string;

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoKeywords?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsUUID()
  siteId: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @IsEnum(PublishStatus)
  @IsOptional()
  publishStatus?: PublishStatus;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsArray()
  @IsOptional()
  coverUrls?: string[];

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  copyFrom?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isTop?: boolean;

  @IsBoolean()
  @IsOptional()
  isRecommend?: boolean;

  @IsBoolean()
  @IsOptional()
  isHot?: boolean;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsDateString()
  @IsOptional()
  expiredAt?: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @IsString()
  @IsOptional()
  redirectUrl?: string;

  @IsString()
  @IsOptional()
  templateName?: string;
}

export class UpdateContentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subTitle?: string;

  @IsString()
  @IsOptional()
  seoTitle?: string;

  @IsString()
  @IsOptional()
  seoKeywords?: string;

  @IsString()
  @IsOptional()
  seoDescription?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @IsEnum(PublishStatus)
  @IsOptional()
  publishStatus?: PublishStatus;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsArray()
  @IsOptional()
  coverUrls?: string[];

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  copyFrom?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isTop?: boolean;

  @IsBoolean()
  @IsOptional()
  isRecommend?: boolean;

  @IsBoolean()
  @IsOptional()
  isHot?: boolean;

  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsDateString()
  @IsOptional()
  expiredAt?: string;

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @IsString()
  @IsOptional()
  redirectUrl?: string;

  @IsString()
  @IsOptional()
  templateName?: string;
}

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createContentDto: CreateContentDto, userId?: string): Promise<Content> {
    const site = await this.siteRepository.findOne({
      where: { id: createContentDto.siteId, isDeleted: false },
    });
    if (!site) {
      throw new BadRequestException('站点不存在');
    }

    if (createContentDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createContentDto.categoryId, isDeleted: false },
      });
      if (!category) {
        throw new BadRequestException('栏目不存在');
      }
    }

    const content = this.contentRepository.create({
      ...createContentDto,
      createdBy: userId,
      updatedBy: userId,
      publishStatus: createContentDto.publishStatus || PublishStatus.DRAFT,
    });

    return this.contentRepository.save(content);
  }

  async findAllBySite(siteId: string, filters?: {
    categoryId?: string;
    contentType?: ContentType;
    publishStatus?: PublishStatus;
    keyword?: string;
  }): Promise<Content[]> {
    const query = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.category', 'category')
      .where('content.siteId = :siteId', { siteId })
      .andWhere('content.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('content.sortOrder', 'ASC')
      .addOrderBy('content.createdAt', 'DESC');

    if (filters?.categoryId) {
      query.andWhere('content.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters?.contentType) {
      query.andWhere('content.contentType = :contentType', { contentType: filters.contentType });
    }
    if (filters?.publishStatus) {
      query.andWhere('content.publishStatus = :publishStatus', { publishStatus: filters.publishStatus });
    }
    if (filters?.keyword) {
      query.andWhere(
        '(content.title LIKE :keyword OR content.summary LIKE :keyword)',
        { keyword: `%${filters.keyword}%` }
      );
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['site', 'category'],
    });

    if (!content) {
      throw new NotFoundException('内容不存在');
    }

    return content;
  }

  async update(id: string, updateContentDto: UpdateContentDto, userId?: string): Promise<Content> {
    const content = await this.findOne(id);

    if (updateContentDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateContentDto.categoryId, isDeleted: false },
      });
      if (!category) {
        throw new BadRequestException('栏目不存在');
      }
    }

    Object.assign(content, {
      ...updateContentDto,
      updatedBy: userId,
    });

    return this.contentRepository.save(content);
  }

  async updatePublishStatus(id: string, publishStatus: PublishStatus, userId?: string): Promise<Content> {
    const content = await this.findOne(id);
    content.publishStatus = publishStatus;
    content.updatedBy = userId;

    if (publishStatus === PublishStatus.PUBLISHED && !content.publishedAt) {
      content.publishedAt = new Date();
    }

    return this.contentRepository.save(content);
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    content.isDeleted = true;
    await this.contentRepository.save(content);
  }

  async batchPublish(ids: string[], userId?: string): Promise<void> {
    await this.contentRepository
      .createQueryBuilder()
      .update(Content)
      .set({
        publishStatus: PublishStatus.PUBLISHED,
        publishedAt: () => 'CURRENT_TIMESTAMP',
        updatedBy: userId,
      })
      .where('id IN (:...ids)', { ids })
      .andWhere('isDeleted = :isDeleted', { isDeleted: false })
      .execute();
  }

  async batchMove(ids: string[], targetCategoryId: string, userId?: string): Promise<void> {
    await this.contentRepository
      .createQueryBuilder()
      .update(Content)
      .set({
        categoryId: targetCategoryId,
        updatedBy: userId,
      })
      .where('id IN (:...ids)', { ids })
      .andWhere('isDeleted = :isDeleted', { isDeleted: false })
      .execute();
  }

  async copyToSite(contentId: string, targetSiteId: string, userId?: string): Promise<Content> {
    const sourceContent = await this.findOne(contentId);

    const newContent = this.contentRepository.create({
      ...sourceContent,
      id: undefined,
      siteId: targetSiteId,
      categoryId: null,
      publishStatus: PublishStatus.DRAFT,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    });

    return this.contentRepository.save(newContent);
  }

  async getPublishedContent(siteId: string, categoryId?: string, contentType?: ContentType, limit = 10): Promise<Content[]> {
    const query = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.category', 'category')
      .where('content.siteId = :siteId', { siteId })
      .andWhere('content.publishStatus = :publishStatus', { publishStatus: PublishStatus.PUBLISHED })
      .andWhere('content.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('(content.expiredAt IS NULL OR content.expiredAt > CURRENT_TIMESTAMP)')
      .orderBy('content.isTop', 'DESC')
      .addOrderBy('content.sortOrder', 'ASC')
      .addOrderBy('content.publishedAt', 'DESC')
      .take(limit);

    if (categoryId) {
      query.andWhere('content.categoryId = :categoryId', { categoryId });
    }
    if (contentType) {
      query.andWhere('content.contentType = :contentType', { contentType });
    }

    return query.getMany();
  }
}
