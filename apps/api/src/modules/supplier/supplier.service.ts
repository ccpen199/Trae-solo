import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, pageSize: number = 10, name?: string, code?: string) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...(name && { name: { contains: name } }),
      ...(code && { code: { contains: code } }),
    };

    const [list, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new BadRequestException('供应商不存在');
    }
    return supplier;
  }

  async create(createSupplierDto: CreateSupplierDto) {
    const { code, name, contactPerson, contactPhone, address, remark } = createSupplierDto;

    const existingSupplier = await this.prisma.supplier.findUnique({ where: { code } });
    if (existingSupplier) {
      throw new BadRequestException('供应商编码已存在');
    }

    return this.prisma.supplier.create({
      data: {
        code,
        name,
        contactPerson,
        contactPhone,
        address,
        remark,
        isActive: true,
      },
    });
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new BadRequestException('供应商不存在');
    }

    // 检查编码是否重复
    if (updateSupplierDto.code && updateSupplierDto.code !== supplier.code) {
      const existingSupplier = await this.prisma.supplier.findUnique({ where: { code: updateSupplierDto.code } });
      if (existingSupplier) {
        throw new BadRequestException('供应商编码已存在');
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  async remove(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new BadRequestException('供应商不存在');
    }

    // 检查是否有关联的原料批次
    const hasBatches = await this.prisma.materialBatch.count({ where: { supplierId: id } });
    if (hasBatches > 0) {
      throw new BadRequestException('该供应商存在关联的原料批次，无法删除');
    }

    return this.prisma.supplier.delete({ where: { id } });
  }
}
