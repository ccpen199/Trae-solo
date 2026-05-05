import { Controller, Post, Get, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../common/entities/base.entity';
import { CreateSiteDto, UpdateSiteDto } from '../common/dto';

@Controller('sites')
export class SitesController {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
  ) {}

  @Post()
  async create(@Body() createSiteDto: CreateSiteDto) {
    const existing = await this.siteRepository.findOne({
      where: { code: createSiteDto.code, isDeleted: false },
    });
    if (existing) {
      return { success: false, message: '站点代码已存在' };
    }

    let parent: Site | null = null;
    if (createSiteDto.parentId) {
      parent = await this.siteRepository.findOne({
        where: { id: createSiteDto.parentId, isDeleted: false },
      });
    }

    const site = this.siteRepository.create({
      ...createSiteDto,
      parent,
    });

    const saved = await this.siteRepository.save(site);
    return { success: true, data: saved };
  }

  @Get()
  async findAll(@Query('includeInactive') includeInactive: string) {
    const query = this.siteRepository
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.parent', 'parent')
      .leftJoinAndSelect('site.children', 'children')
      .where('site.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('site.sortOrder', 'ASC')
      .addOrderBy('site.createdAt', 'DESC');

    if (includeInactive !== 'true') {
      query.andWhere('site.isActive = :isActive', { isActive: true });
    }

    const sites = await query.getMany();
    return { success: true, data: sites };
  }

  @Get('tree')
  async getTree() {
    const sites = await this.siteRepository
      .createQueryBuilder('site')
      .where('site.isDeleted = :isDeleted AND site.isActive = :isActive', { 
        isDeleted: false, 
        isActive: true 
      })
      .orderBy('site.sortOrder', 'ASC')
      .addOrderBy('site.createdAt', 'DESC')
      .getMany();

    const map = new Map<string, any>();
    const roots: any[] = [];

    sites.forEach(site => {
      map.set(site.id, { ...site, children: [] });
    });

    sites.forEach(site => {
      const node = map.get(site.id)!;
      if (site.parentId && map.has(site.parentId)) {
        const parent = map.get(site.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return { success: true, data: roots };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const site = await this.siteRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['parent', 'children'],
    });

    if (!site) {
      return { success: false, message: '站点不存在' };
    }

    return { success: true, data: site };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    const site = await this.siteRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!site) {
      return { success: false, message: '站点不存在' };
    }

    Object.assign(site, updateSiteDto);
    const saved = await this.siteRepository.save(site);
    return { success: true, data: saved };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const site = await this.siteRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!site) {
      return { success: false, message: '站点不存在' };
    }

    site.isDeleted = true;
    await this.siteRepository.save(site);
    return { success: true, message: '删除成功' };
  }
}
