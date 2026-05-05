import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../common/entities/base.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../common/dto';

@Controller('categories')
export class CategoriesController {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
  ) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const site = await this.siteRepository.findOne({
      where: { id: createCategoryDto.siteId, isDeleted: false },
    });

    if (!site) {
      return { success: false, message: '站点不存在' };
    }

    let parent: Category | null = null;
    if (createCategoryDto.parentId) {
      parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId, isDeleted: false },
      });
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      site,
      parent,
    });

    const saved = await this.categoryRepository.save(category);
    return { success: true, data: saved };
  }

  @Get()
  async findAll(@Query('siteId') siteId: string, @Query('includeInactive') includeInactive: string) {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.site', 'site')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children')
      .where('category.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.createdAt', 'DESC');

    if (siteId) {
      query.andWhere('category.siteId = :siteId', { siteId });
    }

    if (includeInactive !== 'true') {
      query.andWhere('category.isActive = :isActive', { isActive: true });
    }

    const categories = await query.getMany();
    return { success: true, data: categories };
  }

  @Get('tree')
  async getTree(@Query('siteId') siteId: string) {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.isDeleted = :isDeleted AND category.isActive = :isActive', { 
        isDeleted: false, 
        isActive: true 
      })
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.createdAt', 'DESC');

    if (siteId) {
      query.andWhere('category.siteId = :siteId', { siteId });
    }

    const categories = await query.getMany();

    const map = new Map<string, any>();
    const roots: any[] = [];

    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        const parent = map.get(cat.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return { success: true, data: roots };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['site', 'parent', 'children'],
    });

    if (!category) {
      return { success: false, message: '栏目不存在' };
    }

    return { success: true, data: category };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!category) {
      return { success: false, message: '栏目不存在' };
    }

    Object.assign(category, updateCategoryDto);
    const saved = await this.categoryRepository.save(category);
    return { success: true, data: saved };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!category) {
      return { success: false, message: '栏目不存在' };
    }

    category.isDeleted = true;
    await this.categoryRepository.save(category);
    return { success: true, message: '删除成功' };
  }
}
