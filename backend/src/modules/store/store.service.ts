import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Organization } from '../organization/entities/organization.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const existing = await this.storeRepository.findOne({
      where: { code: createStoreDto.code },
    });
    if (existing) {
      throw new ConflictException('门店编码已存在');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: createStoreDto.organizationId },
    });
    if (!organization) {
      throw new NotFoundException('所属组织不存在');
    }

    const store = this.storeRepository.create(createStoreDto);
    return this.storeRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storeRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: ['organization', 'manager'],
    });
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id },
      relations: ['organization', 'manager'],
    });
    if (!store) {
      throw new NotFoundException('门店不存在');
    }
    return store;
  }

  async findByCode(code: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { code },
      relations: ['organization', 'manager'],
    });
    if (!store) {
      throw new NotFoundException('门店不存在');
    }
    return store;
  }

  async findByOrganization(organizationId: string): Promise<Store[]> {
    return this.storeRepository.find({
      where: { organizationId, enabled: true },
      order: { sortOrder: 'ASC' },
      relations: ['manager'],
    });
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);

    if (updateStoreDto.code && updateStoreDto.code !== store.code) {
      const existing = await this.storeRepository.findOne({
        where: { code: updateStoreDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('门店编码已存在');
      }
    }

    if (updateStoreDto.organizationId && updateStoreDto.organizationId !== store.organizationId) {
      const organization = await this.organizationRepository.findOne({
        where: { id: updateStoreDto.organizationId },
      });
      if (!organization) {
        throw new NotFoundException('所属组织不存在');
      }
    }

    await this.storeRepository.update(id, updateStoreDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    await this.storeRepository.remove(store);
  }
}
