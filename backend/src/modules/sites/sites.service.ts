import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Site } from '../../common/entities/base.entity';
import { SiteType, DomainType } from '../../common/types';
import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSiteDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsEnum(SiteType)
  @IsOptional()
  siteType?: SiteType;

  @IsEnum(DomainType)
  @IsOptional()
  domainType?: DomainType;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  directory?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  seoConfig?: Record<string, any>;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateSiteDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(SiteType)
  @IsOptional()
  siteType?: SiteType;

  @IsEnum(DomainType)
  @IsOptional()
  domainType?: DomainType;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsString()
  @IsOptional()
  directory?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  seoConfig?: Record<string, any>;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private siteRepository: Repository<Site>,
  ) {}

  async create(createSiteDto: CreateSiteDto): Promise<Site> {
    const existing = await this.siteRepository.findOne({
      where: { code: createSiteDto.code, isDeleted: false },
    });
    if (existing) {
      throw new BadRequestException('站点代码已存在');
    }

    let parent: Site | null = null;
    if (createSiteDto.parentId) {
      parent = await this.siteRepository.findOne({
        where: { id: createSiteDto.parentId, isDeleted: false },
      });
      if (!parent) {
        throw new NotFoundException('父站点不存在');
      }
    }

    const site = this.siteRepository.create({
      ...createSiteDto,
      parent,
    });

    return this.siteRepository.save(site);
  }

  async findAll(includeInactive = false): Promise<Site[]> {
    const query = this.siteRepository
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.parent', 'parent')
      .leftJoinAndSelect('site.children', 'children')
      .where('site.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('site.sortOrder', 'ASC')
      .addOrderBy('site.createdAt', 'DESC');

    if (!includeInactive) {
      query.andWhere('site.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Site> {
    const site = await this.siteRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['parent', 'children'],
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    return site;
  }

  async findByCode(code: string): Promise<Site> {
    const site = await this.siteRepository.findOne({
      where: { code, isDeleted: false },
      relations: ['parent', 'children'],
    });

    if (!site) {
      throw new NotFoundException('站点不存在');
    }

    return site;
  }

  async update(id: string, updateSiteDto: UpdateSiteDto): Promise<Site> {
    const site = await this.findOne(id);

    if (updateSiteDto.parentId) {
      if (updateSiteDto.parentId === id) {
        throw new BadRequestException('不能将自己设为父站点');
      }
      const parent = await this.siteRepository.findOne({
        where: { id: updateSiteDto.parentId, isDeleted: false },
      });
      if (!parent) {
        throw new NotFoundException('父站点不存在');
      }
      site.parent = parent;
    }

    Object.assign(site, updateSiteDto);

    return this.siteRepository.save(site);
  }

  async remove(id: string): Promise<void> {
    const site = await this.findOne(id);
    
    const children = await this.siteRepository.count({
      where: { parent: { id }, isDeleted: false },
    });
    if (children > 0) {
      throw new BadRequestException('请先删除子站点');
    }

    site.isDeleted = true;
    await this.siteRepository.save(site);
  }

  async getSiteTree(): Promise<Site[]> {
    const sites = await this.siteRepository
      .createQueryBuilder('site')
      .where('site.isDeleted = :isDeleted AND site.isActive = :isActive', { 
        isDeleted: false, 
        isActive: true 
      })
      .orderBy('site.sortOrder', 'ASC')
      .addOrderBy('site.createdAt', 'DESC')
      .getMany();

    return this.buildTree(sites);
  }

  private buildTree(sites: Site[]): Site[] {
    const map = new Map<string, Site & { children?: Site[] }>();
    const roots: (Site & { children?: Site[] })[] = [];

    sites.forEach(site => {
      map.set(site.id, { ...site, children: [] });
    });

    sites.forEach(site => {
      const node = map.get(site.id)!;
      if (site.parentId && map.has(site.parentId)) {
        const parent = map.get(site.parentId)!;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async getDescendants(siteId: string): Promise<Site[]> {
    const site = await this.findOne(siteId);
    
    const allSites = await this.siteRepository.find({
      where: { isDeleted: false, isActive: true },
      order: { sortOrder: 'ASC' },
    });

    const descendants: Site[] = [];
    const collectDescendants = (parentId: string) => {
      allSites.forEach(s => {
        if (s.parentId === parentId) {
          descendants.push(s);
          collectDescendants(s.id);
        }
      });
    };

    collectDescendants(siteId);
    return descendants;
  }
}
