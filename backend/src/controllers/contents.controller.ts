import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../common/entities/base.entity';
import { Category } from '../modules/categories/entities/category.entity';
import { Content } from '../modules/contents/entities/content.entity';
import { CreateContentDto, UpdateContentDto } from '../common/dto';

@Controller('contents')
export class ContentsController {
  constructor(
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  @Post()
  async create(@Body() createContentDto: CreateContentDto) {
    const site = await this.siteRepository.findOne({
      where: { id: createContentDto.siteId, isDeleted: false },
    });

    if (!site) {
      return { success: false, message: '站点不存在' };
    }

    const category = await this.categoryRepository.findOne({
      where: { id: createContentDto.categoryId, isDeleted: false },
    });

    if (!category) {
      return { success: false, message: '栏目不存在' };
    }

    const content = this.contentRepository.create({
      ...createContentDto,
      site,
      category,
    });

    const saved = await this.contentRepository.save(content);
    return { success: true, data: saved };
  }

  @Get()
  async findAll(
    @Query('siteId') siteId: string,
    @Query('categoryId') categoryId: string,
    @Query('status') status: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    const query = this.contentRepository
      .createQueryBuilder('content')
      .leftJoinAndSelect('content.site', 'site')
      .leftJoinAndSelect('content.category', 'category')
      .where('content.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('content.sortOrder', 'ASC')
      .addOrderBy('content.createdAt', 'DESC');

    if (siteId) {
      query.andWhere('content.siteId = :siteId', { siteId });
    }

    if (categoryId) {
      query.andWhere('content.categoryId = :categoryId', { categoryId });
    }

    if (status) {
      query.andWhere('content.status = :status', { status });
    }

    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 20;
    query.skip((pageNum - 1) * size).take(size);

    const [contents, total] = await query.getManyAndCount();
    return { 
      success: true, 
      data: {
        list: contents,
        total,
        page: pageNum,
        pageSize: size,
      }
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const content = await this.contentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['site', 'category'],
    });

    if (!content) {
      return { success: false, message: '内容不存在' };
    }

    return { success: true, data: content };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    const content = await this.contentRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!content) {
      return { success: false, message: '内容不存在' };
    }

    Object.assign(content, updateContentDto);
    const saved = await this.contentRepository.save(content);
    return { success: true, data: saved };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const content = await this.contentRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!content) {
      return { success: false, message: '内容不存在' };
    }

    content.isDeleted = true;
    await this.contentRepository.save(content);
    return { success: true, message: '删除成功' };
  }
}
