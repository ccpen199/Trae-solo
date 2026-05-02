import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMaterialDto, UpdateMaterialDto } from './dto';

@Injectable()
export class MaterialService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, pageSize: number = 10, name?: string, code?: string, category?: string) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...(name && { name: { contains: name } }),
      ...(code && { code: { contains: code } }),
      ...(category && { category: { contains: category } }),
    };

    const [list, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new BadRequestException('原料不存在');
    }
    return material;
  }

  async create(createMaterialDto: CreateMaterialDto) {
    const { code, name, specification, unit, category, safetyStock } = createMaterialDto;

    const existingMaterial = await this.prisma.material.findUnique({ where: { code } });
    if (existingMaterial) {
      throw new BadRequestException('原料编码已存在');
    }

    return this.prisma.material.create({
      data: {
        code,
        name,
        specification,
        unit,
        category,
        safetyStock,
        isActive: true,
      },
    });
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new BadRequestException('原料不存在');
    }

    // 检查编码是否重复
    if (updateMaterialDto.code && updateMaterialDto.code !== material.code) {
      const existingMaterial = await this.prisma.material.findUnique({ where: { code: updateMaterialDto.code } });
      if (existingMaterial) {
        throw new BadRequestException('原料编码已存在');
      }
    }

    return this.prisma.material.update({
      where: { id },
      data: updateMaterialDto,
    });
  }

  async remove(id: string) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new BadRequestException('原料不存在');
    }

    // 检查是否有关联的BOM
    const hasBom = await this.prisma.bomMaterial.count({ where: { materialId: id } });
    if (hasBom > 0) {
      throw new BadRequestException('该原料存在于BOM配方中，无法删除');
    }

    // 检查是否有关联的原料批次
    const hasBatches = await this.prisma.materialBatch.count({ where: { materialId: id } });
    if (hasBatches > 0) {
      throw new BadRequestException('该原料存在关联的批次，无法删除');
    }

    // 检查是否有关联的库存记录
    const hasInventory = await this.prisma.inventory.count({ where: { materialId: id } });
    if (hasInventory > 0) {
      throw new BadRequestException('该原料存在库存记录，无法删除');
    }

    return this.prisma.material.delete({ where: { id } });
  }
}
