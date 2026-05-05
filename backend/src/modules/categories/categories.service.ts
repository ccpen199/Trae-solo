import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { ContentType } from '../../common/types';
import { Site } from '../../common/entities/base.entity';
import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsObject, IsArray, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsUUID()
  siteId: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsEnum(ContentType, { each: true })
  @IsOptional()
  allowedContentTypes?: ContentType[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  templateList?: string;

  @IsString()
  @IsOptional()
  templateDetail?: string;

  @IsObject()
  @IsOptional()
  displayRules?: Record<string, any>;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isNavigation?: boolean;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsObject()
  @IsOptional()
  seoConfig?: Record<string, any>;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsEnum(ContentType, { each: true })
  @IsOptional()
  allowedContentTypes?: ContentType[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  templateList?: string;

  @IsString()
  @IsOptional()
  templateDetail?: string;

  @IsObject()
  @IsOptional()
  displayRules?: Record<string, any>;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isNavigation?: boolean;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsObject()
  @IsOptional()
  seoConfig?: Record<string, any>;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const site = await this.siteRepository.findOne({
      where: { id: createCategoryDto.siteId, isDeleted: false },
    });
    if (!site) {
      throw new NotFoundException('所属站点不存在');
    }

    const existing = await this.categoryRepository.findOne({
      where: { 
        siteId: createCategoryDto.siteId, 
        code: createCategoryDto.code,
        isDeleted: false 
      },
    });
    if (existing) {
      throw new BadRequestException('该站点下栏目代码已存在');
    }

    let parent: Category | null = null;
    let level = 1;
    let path = '';

    if (createCategoryDto.parentId) {
      parent = await this.categoryRepository.findOne({
        where: { 
          id: createCategoryDto.parentId, 
          siteId: createCategoryDto.siteId,
          isDeleted: false 
        },
      });
      if (!parent) {
        throw new NotFoundException('父栏目不存在');
      }
      level = parent.level + 1;
      path = parent.path ? `${parent.path},${createCategoryDto.parentId}` : createCategoryDto.parentId;
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      site,
      parent,
      level,
      path,
    });

    const saved = await this.categoryRepository.save(category);
    saved.path = path ? `${path},${saved.id}` : saved.id;
    return this.categoryRepository.save(saved);
  }

  async findAll(siteId?: string, includeInactive = false): Promise<Category[]> {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.site', 'site')
      .where('category.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.createdAt', 'DESC');

    if (siteId) {
      query.andWhere('category.siteId = :siteId', { siteId });
    }

    if (!includeInactive) {
      query.andWhere('category.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findBySite(siteId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { siteId, isDeleted: false, isActive: true },
      relations: ['parent', 'site'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['parent', 'site'],
    });

    if (!category) {
      throw new NotFoundException('栏目不存在');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('不能将自己设为父栏目');
      }

      if (updateCategoryDto.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { 
            id: updateCategoryDto.parentId, 
            siteId: category.siteId,
            isDeleted: false 
          },
        });
        if (!parent) {
          throw new NotFoundException('父栏目不存在');
        }

        const descendants = await this.getDescendants(id);
        if (descendants.some(d => d.id === updateCategoryDto.parentId)) {
          throw new BadRequestException('不能将子栏目设为父栏目');
        }

        category.parent = parent;
        category.level = parent.level + 1;
        category.path = parent.path ? `${parent.path},${updateCategoryDto.parentId}` : updateCategoryDto.parentId;
      } else {
        category.parent = null;
        category.level = 1;
        category.path = null;
      }
    }

    Object.assign(category, updateCategoryDto);

    const saved = await this.categoryRepository.save(category);
    if (category.path) {
      saved.path = `${saved.path},${saved.id}`;
      await this.categoryRepository.save(saved);
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    
    const children = await this.categoryRepository.count({
      where: { parent: { id }, isDeleted: false },
    });
    if (children > 0) {
      throw new BadRequestException('请先删除子栏目');
    }

    category.isDeleted = true;
    await this.categoryRepository.save(category);
  }

  async getCategoryTree(siteId: string): Promise<Category[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .where('category.isDeleted = :isDeleted AND category.isActive = :isActive', { 
        isDeleted: false, 
        isActive: true 
      })
      .andWhere('category.siteId = :siteId', { siteId })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.createdAt', 'DESC')
      .getMany();

    return this.buildTree(categories);
  }

  private buildTree(categories: Category[]): Category[] {
    const map = new Map<string, Category & { children?: Category[] }>();
    const roots: (Category & { children?: Category[] })[] = [];

    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async getDescendants(categoryId: string): Promise<Category[]> {
    const category = await this.findOne(categoryId);
    
    const allCategories = await this.categoryRepository.find({
      where: { siteId: category.siteId, isDeleted: false, isActive: true },
      order: { sortOrder: 'ASC' },
    });

    const descendants: Category[] = [];
    const collectDescendants = (parentId: string) => {
      allCategories.forEach(c => {
        if (c.parentId === parentId) {
          descendants.push(c);
          collectDescendants(c.id);
        }
      });
    };

    collectDescendants(categoryId);
    return descendants;
  }

  async getAncestors(categoryId: string): Promise<Category[]> {
    const category = await this.findOne(categoryId);
    
    if (!category.path) {
      return [];
    }

    const ancestorIds = category.path.split(',').filter(id => id !== categoryId);
    
    if (ancestorIds.length === 0) {
      return [];
    }

    return this.categoryRepository.findByIds(ancestorIds, {
      where: { isDeleted: false },
      order: { level: 'ASC' },
    });
  }
}
