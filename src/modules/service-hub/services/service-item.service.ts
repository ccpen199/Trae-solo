import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceItem } from '../entities/service-item.entity';
import {
  CreateServiceItemDto,
  UpdateServiceItemDto,
  QueryServiceItemDto,
  CreateServiceSubitemDto,
} from '../dto/service-item.dto';
import { ServiceCategoryService } from './service-category.service';

@Injectable()
export class ServiceItemService {
  private readonly logger = new Logger(ServiceItemService.name);

  constructor(
    @InjectRepository(ServiceItem)
    private readonly itemRepository: Repository<ServiceItem>,
    private readonly categoryService: ServiceCategoryService,
  ) {}

  async create(dto: CreateServiceItemDto): Promise<ServiceItem> {
    const existing = await this.itemRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException(`事项编码 ${dto.code} 已存在`);
    }

    if (dto.categoryId) {
      await this.categoryService.findById(dto.categoryId);
    }

    const item = this.itemRepository.create(dto);
    return this.itemRepository.save(item);
  }

  async update(id: string, dto: UpdateServiceItemDto): Promise<ServiceItem> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('事项不存在');
    }

    if (dto.code && dto.code !== item.code) {
      const existing = await this.itemRepository.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new BadRequestException(`事项编码 ${dto.code} 已存在`);
      }
    }

    if (dto.categoryId && dto.categoryId !== item.categoryId) {
      await this.categoryService.findById(dto.categoryId);
    }

    Object.assign(item, dto);
    return this.itemRepository.save(item);
  }

  async delete(id: string): Promise<void> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('事项不存在');
    }
    await this.itemRepository.softDelete(id);
  }

  async findById(id: string): Promise<ServiceItem> {
    const item = await this.itemRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('事项不存在');
    }
    return item;
  }

  async findDetail(id: string): Promise<ServiceItem> {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['category', 'subitems'],
    });
    if (!item) {
      throw new NotFoundException('事项不存在');
    }
    return item;
  }

  async findAll(query: QueryServiceItemDto): Promise<{ list: ServiceItem[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const qb = this.itemRepository.createQueryBuilder('i');

    if (query.title) {
      qb.andWhere('i.title LIKE :title', { title: `%${query.title}%` });
    }
    if (query.code) {
      qb.andWhere('i.code = :code', { code: query.code });
    }
    if (query.categoryId) {
      const descendantIds = await this.categoryService.getDescendantIds(query.categoryId);
      const allIds = [query.categoryId, ...descendantIds];
      qb.andWhere('i.categoryId IN (:...categoryIds)', { categoryIds: allIds });
    }
    if (query.deptCode) {
      qb.andWhere('i.deptCode = :deptCode', { deptCode: query.deptCode });
    }
    if (query.serviceType) {
      qb.andWhere('i.serviceType = :serviceType', { serviceType: query.serviceType });
    }
    if (query.handlingMode) {
      qb.andWhere('i.handlingMode = :handlingMode', { handlingMode: query.handlingMode });
    }
    if (query.keyword) {
      qb.andWhere('(i.title LIKE :keyword OR i.code LIKE :keyword)', {
        keyword: `%${query.keyword}%`,
      });
    }

    qb.leftJoinAndSelect('i.category', 'c')
      .orderBy('i.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total };
  }

  async getMaterialsRequired(itemId: string): Promise<any[]> {
    const item = await this.findById(itemId);
    return item.materialsRequired || [];
  }
}
