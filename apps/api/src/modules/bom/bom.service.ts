import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBomDto, UpdateBomDto } from './dto';

@Injectable()
export class BomService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, pageSize: number = 10, productCode?: string, productName?: string) {
    const skip = (page - 1) * pageSize;
    const where = {
      product: {
        ...(productCode && { code: { contains: productCode } }),
        ...(productName && { name: { contains: productName } }),
      },
    };

    const [list, total] = await Promise.all([
      this.prisma.bom.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          product: true,
          materials: {
            include: {
              material: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.bom.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const bom = await this.prisma.bom.findUnique({
      where: { id },
      include: {
        product: true,
        materials: {
          include: {
            material: true,
          },
        },
      },
    });
    if (!bom) {
      throw new BadRequestException('BOM配方不存在');
    }
    return bom;
  }

  async create(createBomDto: CreateBomDto) {
    const { productId, version, materials } = createBomDto;

    // 检查产品是否存在
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new BadRequestException('产品不存在');
    }

    // 检查是否已存在相同版本的BOM
    const existingBom = await this.prisma.bom.findFirst({
      where: { productId, version },
    });
    if (existingBom) {
      throw new BadRequestException('该产品的此版本BOM已存在');
    }

    // 检查原料是否存在
    for (const materialItem of materials) {
      const material = await this.prisma.material.findUnique({ where: { id: materialItem.materialId } });
      if (!material) {
        throw new BadRequestException(`原料ID ${materialItem.materialId} 不存在`);
      }
    }

    return this.prisma.bom.create({
      data: {
        code: `BOM-${product.code}-${version}`,
        name: `${product.name} BOM v${version}`,
        productId,
        version,
        materials: {
          create: materials.map((item) => ({
            material: {
              connect: { id: item.materialId },
            },
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
      },
      include: {
        product: true,
        materials: {
          include: {
            material: true,
          },
        },
      },
    });
  }

  async update(id: string, updateBomDto: UpdateBomDto) {
    const { version, materials } = updateBomDto;

    const bom = await this.prisma.bom.findUnique({ where: { id } });
    if (!bom) {
      throw new BadRequestException('BOM配方不存在');
    }

    // 检查版本是否重复
    if (version && version !== bom.version) {
      const existingBom = await this.prisma.bom.findFirst({
        where: { productId: bom.productId, version },
      });
      if (existingBom) {
        throw new BadRequestException('该产品的此版本BOM已存在');
      }
    }

    // 检查原料是否存在
    if (materials) {
      for (const materialItem of materials) {
        const material = await this.prisma.material.findUnique({ where: { id: materialItem.materialId } });
        if (!material) {
          throw new BadRequestException(`原料ID ${materialItem.materialId} 不存在`);
        }
      }
    }

    return this.prisma.bom.update({
      where: { id },
      data: {
        ...(version && { version }),
        ...(materials && {
          materials: {
            deleteMany: {},
            create: materials.map((item) => ({
              material: {
                connect: { id: item.materialId },
              },
              quantity: item.quantity,
              unit: item.unit,
            })),
          },
        }),
      },
      include: {
        product: true,
        materials: {
          include: {
            material: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const bom = await this.prisma.bom.findUnique({ where: { id } });
    if (!bom) {
      throw new BadRequestException('BOM配方不存在');
    }

    // 检查是否有关联的生产工单
    const hasWorkOrders = await this.prisma.workOrder.count({ where: { productId: bom.productId } });
    if (hasWorkOrders > 0) {
      throw new BadRequestException('该BOM配方已被生产工单使用，无法删除');
    }

    return this.prisma.bom.delete({ where: { id } });
  }
}
