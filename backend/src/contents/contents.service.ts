import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { Content, Category } from './entities/content.entity';
import { ContentVersion } from './entities/content-version.entity';
import {
  CreateContentDto,
  UpdateContentDto,
  UpdateStatusDto,
  CreateCategoryDto,
} from './dto/content.dto';
import { ContentStatus, UserRole } from '../common/enums';
import { PaginationDto, PaginatedResponseDto } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(ContentVersion)
    private contentVersionRepository: Repository<ContentVersion>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private dataSource: DataSource,
    private auditService: AuditService,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    userId: string,
    userRole: UserRole,
    status?: ContentStatus,
    categoryId?: string,
  ): Promise<PaginatedResponseDto<Content>> {
    const { page, limit, sortBy, sortOrder } = paginationDto;
    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.category', 'category');

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.CHIEF_EDITOR &&
      userRole !== UserRole.DATA_ANALYST
    ) {
      queryBuilder.andWhere('content.authorId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('content.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('content.categoryId = :categoryId', { categoryId });
    }

    if (sortBy) {
      queryBuilder.orderBy(`content.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('content.updatedAt', 'DESC');
    }

    const [contents, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResponseDto(contents, total, page, limit);
  }

  async findById(id: string, userId: string, userRole: UserRole): Promise<Content> {
    const content = await this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.category', 'category')
      .where('content.id = :id', { id })
      .getOne();

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.CHIEF_EDITOR &&
      content.authorId !== userId
    ) {
      throw new ForbiddenException('You do not have permission to access this content');
    }

    return content;
  }

  async create(createContentDto: CreateContentDto, userId: string): Promise<Content> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const content = this.contentRepository.create({
        ...createContentDto,
        authorId: userId,
        status: ContentStatus.DRAFT,
      });

      const savedContent = await queryRunner.manager.save(content);

      const version = this.contentVersionRepository.create({
        contentId: savedContent.id,
        versionNumber: 1,
        title: savedContent.title,
        contentBody: savedContent.contentBody,
        summary: savedContent.summary,
        featuredImageUrl: savedContent.featuredImageUrl,
        changeReason: 'Initial version',
        createdById: userId,
      });

      await queryRunner.manager.save(version);

      await queryRunner.commitTransaction();

      await this.auditService.logAction({
        userId,
        action: 'CONTENT_CREATE',
        resourceType: 'CONTENT',
        resourceId: savedContent.id,
        resourceTitle: savedContent.title,
        newValue: savedContent,
      });

      return savedContent;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    updateContentDto: UpdateContentDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Content> {
    const content = await this.findById(id, userId, userRole);
    const { changeReason, ...updateData } = updateContentDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const oldValue = { ...content };
      Object.assign(content, updateData);
      content.currentVersion += 1;

      const savedContent = await queryRunner.manager.save(content);

      const version = this.contentVersionRepository.create({
        contentId: savedContent.id,
        versionNumber: savedContent.currentVersion,
        title: savedContent.title,
        contentBody: savedContent.contentBody,
        summary: savedContent.summary,
        featuredImageUrl: savedContent.featuredImageUrl,
        changeReason: changeReason || 'Content updated',
        createdById: userId,
      });

      await queryRunner.manager.save(version);

      await queryRunner.commitTransaction();

      await this.auditService.logAction({
        userId,
        action: 'CONTENT_UPDATE',
        resourceType: 'CONTENT',
        resourceId: savedContent.id,
        resourceTitle: savedContent.title,
        oldValue,
        newValue: savedContent,
      });

      return savedContent;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Content> {
    const content = await this.findById(id, userId, userRole);
    const oldStatus = content.status;
    content.status = updateStatusDto.status;

    const savedContent = await this.contentRepository.save(content);

    await this.auditService.logAction({
      userId,
      action: 'CONTENT_STATUS_CHANGE',
      resourceType: 'CONTENT',
      resourceId: savedContent.id,
      resourceTitle: savedContent.title,
      oldValue: { status: oldStatus },
      newValue: { status: updateStatusDto.status },
    });

    return savedContent;
  }

  async getVersions(contentId: string): Promise<ContentVersion[]> {
    return this.contentVersionRepository.find({
      where: { contentId },
      order: { versionNumber: 'DESC' },
      relations: ['createdBy'],
    });
  }

  async getVersion(contentId: string, versionNumber: number): Promise<ContentVersion> {
    const version = await this.contentVersionRepository.findOne({
      where: { contentId, versionNumber },
      relations: ['createdBy'],
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found for content ${contentId}`);
    }

    return version;
  }

  async compareVersions(
    contentId: string,
    version1: number,
    version2: number,
  ): Promise<{ version1: ContentVersion; version2: ContentVersion }> {
    const v1 = await this.getVersion(contentId, version1);
    const v2 = await this.getVersion(contentId, version2);

    return { version1: v1, version2: v2 };
  }

  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const content = await this.findById(id, userId, userRole);

    if (
      userRole !== UserRole.ADMIN &&
      userRole !== UserRole.CHIEF_EDITOR &&
      content.authorId !== userId
    ) {
      throw new ForbiddenException('You do not have permission to delete this content');
    }

    await this.auditService.logAction({
      userId,
      action: 'CONTENT_DELETE',
      resourceType: 'CONTENT',
      resourceId: id,
      resourceTitle: content.title,
      oldValue: content,
    });

    await this.contentRepository.delete(id);
  }

  async findAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
      relations: ['parent', 'children'],
    });
  }

  async createCategory(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    const savedCategory = await this.categoryRepository.save(category);

    await this.auditService.logAction({
      userId,
      action: 'CATEGORY_CREATE',
      resourceType: 'CATEGORY',
      resourceId: savedCategory.id,
      resourceTitle: savedCategory.name,
      newValue: savedCategory,
    });

    return savedCategory;
  }
}
