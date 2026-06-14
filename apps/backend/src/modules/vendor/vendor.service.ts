import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { VendorAuthType } from '@iot/shared';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(VendorEntity) private readonly vendorRepo: Repository<VendorEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
  ) {}

  async create(dto: Partial<VendorEntity> & { name: string }) {
    const existing = await this.vendorRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('厂商名称已存在');

    const apiKey = this.generateApiKey();
    const rawSecret = this.generateApiSecret();
    const apiSecret = await bcrypt.hash(rawSecret, 10);

    const vendor = this.vendorRepo.create({
      ...dto,
      apiKey,
      apiSecret,
      authType: dto.authType || VendorAuthType.API_KEY,
      whitelistEnabled: dto.whitelistEnabled ?? true,
      status: 'pending',
    });
    const saved = await this.vendorRepo.save(vendor);
    return { ...saved, apiSecretRaw: rawSecret, apiSecret: undefined as any };
  }

  async findAll(page = 1, pageSize = 20, keyword?: string, status?: string) {
    const pagination = this.normalizePagination(page, pageSize, 20);
    const qb = this.vendorRepo.createQueryBuilder('v');
    if (keyword) qb.where('LOWER(v.name) LIKE :kw', { kw: `%${keyword.toLowerCase()}%` });
    if (status) qb.andWhere('v.status = :st', { st: status });

    const [items, total] = await qb
      .orderBy('v.createdAt', 'DESC')
      .skip((pagination.page - 1) * pagination.pageSize)
      .take(pagination.pageSize)
      .getManyAndCount();

    return { items, total, ...pagination };
  }

  async findOne(id: string) {
    const vendor = await this.vendorRepo.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('厂商不存在');
    return vendor;
  }

  async update(id: string, dto: Partial<VendorEntity>) {
    const vendor = await this.findOne(id);
    Object.assign(vendor, dto);
    return this.vendorRepo.save(vendor);
  }

  async rotateCredentials(id: string) {
    const vendor = await this.findOne(id);
    const rawSecret = this.generateApiSecret();
    vendor.apiSecret = await bcrypt.hash(rawSecret, 10);
    vendor.apiKey = this.generateApiKey();
    const saved = await this.vendorRepo.save(vendor);
    return { ...saved, apiSecretRaw: rawSecret, apiSecret: undefined as any };
  }

  async updateIpWhitelist(id: string, ipRanges: string[]) {
    const vendor = await this.findOne(id);
    vendor.allowedIpRanges = ipRanges;
    return this.vendorRepo.save(vendor);
  }

  async setStatus(id: string, status: 'active' | 'suspended') {
    const vendor = await this.findOne(id);
    vendor.status = status;
    return this.vendorRepo.save(vendor);
  }

  async getVendorDevices(vendorId: string, page = 1, pageSize = 50) {
    const pagination = this.normalizePagination(page, pageSize, 50);
    const [items, total] = await this.deviceRepo.findAndCount({
      where: { vendorId },
      order: { createdAt: 'DESC' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    });
    return { items, total, ...pagination };
  }

  async getStats() {
    const total = await this.vendorRepo.count();
    const active = await this.vendorRepo.count({ where: { status: 'active' } });
    const suspended = await this.vendorRepo.count({ where: { status: 'suspended' } });
    const pending = await this.vendorRepo.count({ where: { status: 'pending' } });
    return { total, active, suspended, pending };
  }

  private generateApiKey(): string {
    return `vnd_${uuidv4().replace(/-/g, '')}`;
  }

  private generateApiSecret(): string {
    return Buffer.from(uuidv4() + uuidv4()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 48);
  }

  private normalizePagination(page: number, pageSize: number, defaultPageSize: number) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 200) : defaultPageSize;
    return { page: safePage, pageSize: safePageSize };
  }
}
