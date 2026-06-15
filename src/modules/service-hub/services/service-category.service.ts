import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
  QueryServiceCategoryDto,
} from '../dto/service-category.dto';

@Injectable()
export class ServiceCategoryService {
  private readonly logger = new Logger(ServiceCategoryService.name);

  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
  ) {}

  async create(dto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    const existing = await this.categoryRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException(`分类编码 ${dto.code} 已存在`);
    }

    let level = 1;
    if (dto.parentId) {
      const parent = await this.categoryRepository.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('父级分类不存在');
      }
      level = parent.level + 1;
    }

    const category = this.categoryRepository.create({
      ...dto,
      level,
    });
    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateServiceCategoryDto): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (dto.code && dto.code !== category.code) {
      const existing = await this.categoryRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new BadRequestException(`分类编码 ${dto.code} 已存在`);
      }
    }

    let level = category.level;
    if (dto.parentId !== undefined && dto.parentId !== category.parentId) {
      if (dto.parentId === null) {
        level = 1;
      } else {
        const parent = await this.categoryRepository.findOne({ where: { id: dto.parentId } });
        if (!parent) {
          throw new NotFoundException('父级分类不存在');
        }
        if (parent.id === id) {
          throw new BadRequestException('不能将自己设置为父级分类');
        }
        level = parent.level + 1;
      }
    }

    Object.assign(category, { ...dto, level });
    return this.categoryRepository.save(category);
  }

  async delete(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    const childrenCount = await this.categoryRepository.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      throw new BadRequestException('存在子分类，无法删除');
    }

    await this.categoryRepository.softDelete(id);
  }

  async findById(id: string): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    return category;
  }

  async findAll(query: QueryServiceCategoryDto): Promise<ServiceCategory[]> {
    const qb = this.categoryRepository.createQueryBuilder('c');

    if (query.name) {
      qb.andWhere('c.name LIKE :name', { name: `%${query.name}%` });
    }
    if (query.code) {
      qb.andWhere('c.code = :code', { code: query.code });
    }
    if (query.deptCode) {
      qb.andWhere('c.deptCode = :deptCode', { deptCode: query.deptCode });
    }
    if (query.level) {
      qb.andWhere('c.level = :level', { level: query.level });
    }
    if (query.parentId) {
      qb.andWhere('c.parentId = :parentId', { parentId: query.parentId });
    }

    qb.orderBy('c.level', 'ASC').addOrderBy('c.sort', 'ASC');

    return qb.getMany();
  }

  async getCategoryTree(deptCode?: string): Promise<ServiceCategory[]> {
    const qb = this.categoryRepository.createQueryBuilder('c');
    if (deptCode) {
      qb.where('c.deptCode = :deptCode', { deptCode });
    }
    qb.orderBy('c.level', 'ASC').addOrderBy('c.sort', 'ASC');

    const allCategories = await qb.getMany();
    return this.buildTree(allCategories, null);
  }

  async getDescendantIds(parentId: string): Promise<string[]> {
    const result: string[] = [];
    const queue: string[] = [parentId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.categoryRepository.find({
        where: { parentId: currentId },
        select: ['id'],
      });
      for (const child of children) {
        result.push(child.id);
        queue.push(child.id);
      }
    }

    return result;
  }

  async getAncestors(id: string): Promise<ServiceCategory[]> {
    const ancestors: ServiceCategory[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const category = await this.categoryRepository.findOne({ where: { id: currentId } });
      if (!category) break;
      ancestors.unshift(category);
      currentId = category.parentId;
    }

    return ancestors;
  }

  private buildTree(categories: ServiceCategory[], parentId: string | null): ServiceCategory[] {
    const result: ServiceCategory[] = [];
    for (const category of categories) {
      if (category.parentId === parentId) {
        const children = this.buildTree(categories, category.id);
        (category as any).children = children;
        result.push(category);
      }
    }
    return result;
  }
}
