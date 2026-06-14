import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateMaterialTemplateDto, UpdateMaterialTemplateDto } from './dto/service-item.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class MaterialTemplateService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async create(serviceItemId: string, dto: CreateMaterialTemplateDto) {
    this.logger.log(`创建材料模板: ${dto.materialName}`, 'MaterialTemplateService');
    return this.prisma.materialTemplate.create({
      data: {
        ...dto,
        serviceItemId,
      },
    });
  }

  async findByServiceItem(serviceItemId: string) {
    return this.prisma.materialTemplate.findMany({
      where: { serviceItemId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async update(id: string, dto: UpdateMaterialTemplateDto) {
    const tpl = await this.prisma.materialTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException('材料模板不存在');
    return this.prisma.materialTemplate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.materialTemplate.delete({ where: { id } });
  }
}
