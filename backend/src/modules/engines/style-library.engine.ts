import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Style } from '../../styles/entities/style.entity';
import { StyleStatus } from '../../common/enums/style-status.enum';

@Injectable()
export class StyleLibraryEngine {
  private readonly logger = new Logger(StyleLibraryEngine.name);

  constructor(
    @InjectRepository(Style)
    private styleRepository: Repository<Style>,
  ) {}

  async searchStyles(
    keyword?: string,
    category?: string,
    season?: string,
    year?: number,
    status?: StyleStatus,
    designerId?: string,
    isReusable?: boolean,
    tags?: string[],
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{
    data: Style[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const query = this.styleRepository.createQueryBuilder('style');

    if (keyword) {
      query.andWhere(
        '(style.name LIKE :keyword OR style.styleNumber LIKE :keyword OR style.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (category) {
      query.andWhere('style.styleCategory = :category', { category });
    }

    if (season) {
      query.andWhere('style.season = :season', { season });
    }

    if (year) {
      query.andWhere('style.year = :year', { year });
    }

    if (status) {
      query.andWhere('style.status = :status', { status });
    }

    if (designerId) {
      query.andWhere('style.designerId = :designerId', { designerId });
    }

    if (isReusable !== undefined) {
      query.andWhere('style.isReusable = :isReusable', { isReusable });
    }

    if (tags && tags.length > 0) {
      query.andWhere('style.tags && :tags', { tags });
    }

    query.andWhere('style.deletedAt IS NULL');
    query.orderBy('style.updatedAt', 'DESC');

    const [data, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async markAsReusable(
    styleId: string,
    userId: string,
    tags?: string[],
  ): Promise<Style> {
    const style = await this.styleRepository.findOne({
      where: { id: styleId },
    });

    if (!style) {
      throw new Error(`款式不存在: ${styleId}`);
    }

    style.isReusable = true;
    style.updatedBy = userId;

    if (tags && tags.length > 0) {
      if (!style.tags) {
        style.tags = [];
      }
      style.tags = [...new Set([...style.tags, ...tags])];
    }

    return this.styleRepository.save(style);
  }

  async unmarkAsReusable(styleId: string, userId: string): Promise<Style> {
    const style = await this.styleRepository.findOne({
      where: { id: styleId },
    });

    if (!style) {
      throw new Error(`款式不存在: ${styleId}`);
    }

    style.isReusable = false;
    style.updatedBy = userId;

    return this.styleRepository.save(style);
  }

  async getSimilarStyles(
    styleId: string,
    limit: number = 10,
  ): Promise<Style[]> {
    const style = await this.styleRepository.findOne({
      where: { id: styleId },
    });

    if (!style) {
      return [];
    }

    const query = this.styleRepository.createQueryBuilder('s');

    if (style.styleCategory) {
      query.orWhere('s.styleCategory = :category', {
        category: style.styleCategory,
      });
    }

    if (style.season) {
      query.orWhere('s.season = :season', { season: style.season });
    }

    if (style.tags && style.tags.length > 0) {
      query.orWhere('s.tags && :tags', { tags: style.tags });
    }

    query.andWhere('s.id != :styleId', { styleId });
    query.andWhere('s.deletedAt IS NULL');
    query.orderBy('s.updatedAt', 'DESC');
    query.limit(limit);

    return query.getMany();
  }

  async getStyleStatistics(designerId?: string): Promise<{
    total: number;
    byStatus: { [key: string]: number };
    byCategory: { [key: string]: number };
    bySeason: { [key: string]: number };
    reusableCount: number;
  }> {
    const query = this.styleRepository.createQueryBuilder('style');
    query.andWhere('style.deletedAt IS NULL');

    if (designerId) {
      query.andWhere('style.designerId = :designerId', { designerId });
    }

    const total = await query.getCount();

    const byStatusQuery = this.styleRepository
      .createQueryBuilder('style')
      .select('style.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .andWhere('style.deletedAt IS NULL');

    if (designerId) {
      byStatusQuery.andWhere('style.designerId = :designerId', { designerId });
    }

    const byStatusRaw = await byStatusQuery
      .groupBy('style.status')
      .getRawMany();

    const byStatus: { [key: string]: number } = {};
    byStatusRaw.forEach((item) => {
      byStatus[item.status] = parseInt(item.count, 10);
    });

    const byCategoryQuery = this.styleRepository
      .createQueryBuilder('style')
      .select('style.styleCategory', 'category')
      .addSelect('COUNT(*)', 'count')
      .andWhere('style.deletedAt IS NULL')
      .andWhere('style.styleCategory IS NOT NULL');

    if (designerId) {
      byCategoryQuery.andWhere('style.designerId = :designerId', { designerId });
    }

    const byCategoryRaw = await byCategoryQuery
      .groupBy('style.styleCategory')
      .getRawMany();

    const byCategory: { [key: string]: number } = {};
    byCategoryRaw.forEach((item) => {
      byCategory[item.category] = parseInt(item.count, 10);
    });

    const bySeasonQuery = this.styleRepository
      .createQueryBuilder('style')
      .select('style.season', 'season')
      .addSelect('COUNT(*)', 'count')
      .andWhere('style.deletedAt IS NULL')
      .andWhere('style.season IS NOT NULL');

    if (designerId) {
      bySeasonQuery.andWhere('style.designerId = :designerId', { designerId });
    }

    const bySeasonRaw = await bySeasonQuery
      .groupBy('style.season')
      .getRawMany();

    const bySeason: { [key: string]: number } = {};
    bySeasonRaw.forEach((item) => {
      bySeason[item.season] = parseInt(item.count, 10);
    });

    const reusableQuery = this.styleRepository
      .createQueryBuilder('style')
      .andWhere('style.isReusable = true')
      .andWhere('style.deletedAt IS NULL');

    if (designerId) {
      reusableQuery.andWhere('style.designerId = :designerId', { designerId });
    }

    const reusableCount = await reusableQuery.getCount();

    return {
      total,
      byStatus,
      byCategory,
      bySeason,
      reusableCount,
    };
  }

  async archiveStyle(styleId: string, userId: string): Promise<Style> {
    const style = await this.styleRepository.findOne({
      where: { id: styleId },
    });

    if (!style) {
      throw new Error(`款式不存在: ${styleId}`);
    }

    style.isArchived = true;
    style.updatedBy = userId;

    return this.styleRepository.save(style);
  }

  async unarchiveStyle(styleId: string, userId: string): Promise<Style> {
    const style = await this.styleRepository.findOne({
      where: { id: styleId },
    });

    if (!style) {
      throw new Error(`款式不存在: ${styleId}`);
    }

    style.isArchived = false;
    style.updatedBy = userId;

    return this.styleRepository.save(style);
  }
}
