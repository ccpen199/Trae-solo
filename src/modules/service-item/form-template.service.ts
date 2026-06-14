import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFormTemplateDto, UpdateFormTemplateDto } from './dto/service-item.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

@Injectable()
export class FormTemplateService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async create(serviceItemId: string, dto: CreateFormTemplateDto) {
    this.logger.log(`创建表单模板: ${dto.templateName}`, 'FormTemplateService');
    return this.prisma.formTemplate.create({
      data: {
        ...dto,
        serviceItemId,
      },
    });
  }

  async findByServiceItem(serviceItemId: string, onlyActive = true) {
    const where: any = { serviceItemId };
    if (onlyActive) where.isActive = true;
    return this.prisma.formTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const tpl = await this.prisma.formTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException('表单模板不存在');
    return tpl;
  }

  async update(id: string, dto: UpdateFormTemplateDto) {
    const tpl = await this.prisma.formTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException('表单模板不存在');
    return this.prisma.formTemplate.update({ where: { id }, data: dto });
  }

  async setActive(id: string, isActive: boolean) {
    return this.prisma.formTemplate.update({ where: { id }, data: { isActive } });
  }

  async remove(id: string) {
    return this.prisma.formTemplate.delete({ where: { id } });
  }
}
