import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.organizationRepository.findOne({
      where: { code: createOrganizationDto.code },
    });
    if (existing) {
      throw new ConflictException('组织编码已存在');
    }

    if (createOrganizationDto.parentId) {
      const parent = await this.organizationRepository.findOne({
        where: { id: createOrganizationDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('上级组织不存在');
      }
    }

    const organization = this.organizationRepository.create(createOrganizationDto);
    return this.organizationRepository.save(organization);
  }

  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      relations: ['parent'],
    });
  }

  async findOne(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'users', 'stores'],
    });
    if (!organization) {
      throw new NotFoundException('组织不存在');
    }
    return organization;
  }

  async findByCode(code: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { code },
    });
    if (!organization) {
      throw new NotFoundException('组织不存在');
    }
    return organization;
  }

  async getTree(): Promise<Organization[]> {
    const allOrgs = await this.organizationRepository.find({
      where: { enabled: true },
      order: { sortOrder: 'ASC' },
    });

    const buildTree = (parentId: string | null): Organization[] => {
      return allOrgs
        .filter((org) => org.parentId === parentId)
        .map((org) => ({
          ...org,
          children: buildTree(org.id),
        } as Organization));
    };

    return buildTree(null);
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(id);

    if (updateOrganizationDto.code && updateOrganizationDto.code !== organization.code) {
      const existing = await this.organizationRepository.findOne({
        where: { code: updateOrganizationDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('组织编码已存在');
      }
    }

    if (updateOrganizationDto.parentId === id) {
      throw new ConflictException('不能将自己设为上级组织');
    }

    await this.organizationRepository.update(id, updateOrganizationDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const organization = await this.findOne(id);

    const children = await this.organizationRepository.find({
      where: { parentId: id },
    });
    if (children.length > 0) {
      throw new ConflictException('该组织下有子组织，无法删除');
    }

    if (organization.users?.length > 0 || organization.stores?.length > 0) {
      throw new ConflictException('该组织下有人员或门店，无法删除');
    }

    await this.organizationRepository.remove(organization);
  }

  async getChildrenIds(parentId: string): Promise<string[]> {
    const orgs = await this.organizationRepository
      .createQueryBuilder('org')
      .where('org.parent_id = :parentId', { parentId })
      .getMany();

    let ids = [parentId];
    for (const org of orgs) {
      const childIds = await this.getChildrenIds(org.id);
      ids = [...ids, ...childIds];
    }
    return ids;
  }
}
