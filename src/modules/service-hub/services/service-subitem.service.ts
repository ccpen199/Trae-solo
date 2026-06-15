import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceSubitem } from '../entities/service-subitem.entity';
import { ServiceItemService } from './service-item.service';

@Injectable()
export class ServiceSubitemService {
  private readonly logger = new Logger(ServiceSubitemService.name);

  constructor(
    @InjectRepository(ServiceSubitem)
    private readonly subitemRepository: Repository<ServiceSubitem>,
    private readonly itemService: ServiceItemService,
  ) {}

  async create(dto: any): Promise<ServiceSubitem> {
    await this.itemService.findById(dto.itemId);

    const subitem = this.subitemRepository.create(dto);
    const result = await this.subitemRepository.save(subitem as any);
    return Array.isArray(result) ? result[0] : result;
  }

  async update(id: string, dto: any): Promise<ServiceSubitem> {
    const subitem = await this.subitemRepository.findOne({ where: { id } });
    if (!subitem) {
      throw new NotFoundException('事项子项不存在');
    }

    if (dto.itemId && dto.itemId !== subitem.itemId) {
      await this.itemService.findById(dto.itemId);
    }

    Object.assign(subitem, dto);
    const result = await this.subitemRepository.save(subitem as any);
    return Array.isArray(result) ? result[0] : result;
  }

  async delete(id: string): Promise<void> {
    const subitem = await this.subitemRepository.findOne({ where: { id } });
    if (!subitem) {
      throw new NotFoundException('事项子项不存在');
    }
    await this.subitemRepository.softDelete(id);
  }

  async findById(id: string): Promise<ServiceSubitem> {
    const subitem = await this.subitemRepository.findOne({ where: { id } });
    if (!subitem) {
      throw new NotFoundException('事项子项不存在');
    }
    return subitem;
  }

  async findByItemId(itemId: string): Promise<ServiceSubitem[]> {
    return this.subitemRepository.find({
      where: { itemId },
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
  }

  async findWithItem(itemId: string, subitemId: string): Promise<ServiceSubitem> {
    const subitem = await this.subitemRepository.findOne({
      where: { id: subitemId, itemId },
      relations: ['item'],
    });
    if (!subitem) {
      throw new NotFoundException('事项子项不存在');
    }
    return subitem;
  }
}

