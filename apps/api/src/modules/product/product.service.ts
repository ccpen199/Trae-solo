import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, pageSize: number = 10, name?: string, code?: string, category?: string) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...(name && { name: { contains: name } }),
      ...(code && { code: { contains: code } }),
      ...(category && { category: { contains: category } }),
    };

    const [list, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new BadRequestException('产品不存在');
    }
    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const { code, name, specification, unit, category, sellingPrice } = createProductDto;

    const existingProduct = await this.prisma.product.findUnique({ where: { code } });
    if (existingProduct) {
      throw new BadRequestException('产品编码已存在');
    }

    return this.prisma.product.create({
      data: {
        code,
        name,
        specification,
        unit,
        category,
        sellingPrice,
        isActive: true,
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new BadRequestException('产品不存在');
    }

    // 检查编码是否重复
    if (updateProductDto.code && updateProductDto.code !== product.code) {
      const existingProduct = await this.prisma.product.findUnique({ where: { code: updateProductDto.code } });
      if (existingProduct) {
        throw new BadRequestException('产品编码已存在');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new BadRequestException('产品不存在');
    }

    // 检查是否有关联的BOM
    const hasBom = await this.prisma.bom.count({ where: { productId: id } });
    if (hasBom > 0) {
      throw new BadRequestException('该产品存在BOM配方，无法删除');
    }

    // 检查是否有关联的生产工单
    const hasWorkOrders = await this.prisma.workOrder.count({ where: { productId: id } });
    if (hasWorkOrders > 0) {
      throw new BadRequestException('该产品存在生产工单，无法删除');
    }

    // 检查是否有关联的产品批次
    const hasBatches = await this.prisma.productBatch.count({ where: { productId: id } });
    if (hasBatches > 0) {
      throw new BadRequestException('该产品存在关联的批次，无法删除');
    }

    // 检查是否有关联的库存记录
    const hasInventory = await this.prisma.inventory.count({ where: { productId: id } });
    if (hasInventory > 0) {
      throw new BadRequestException('该产品存在库存记录，无法删除');
    }

    return this.prisma.product.delete({ where: { id } });
  }
}
