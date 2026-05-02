import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInboundDto } from './dto';
import { BatchGeneratorService } from '../../engines/batch-generator/batch-generator.service';

@Injectable()
export class InboundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchGenerator: BatchGeneratorService,
  ) {}

  async findAll(page: number = 1, pageSize: number = 10, materialCode?: string, supplierCode?: string, batchNumber?: string) {
    const skip = (page - 1) * pageSize;
    const where = {
      ...(materialCode && {
        material: {
          code: { contains: materialCode },
        },
      }),
      ...(supplierCode && {
        supplier: {
          code: { contains: supplierCode },
        },
      }),
      ...(batchNumber && { batchNumber: { contains: batchNumber } }),
    };

    const [list, total] = await Promise.all([
      this.prisma.inbound.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          material: true,
          supplier: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inbound.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const inbound = await this.prisma.inbound.findUnique({
      where: { id },
      include: {
        material: true,
        supplier: true,
      },
    });
    if (!inbound) {
      throw new BadRequestException('入库记录不存在');
    }
    return inbound;
  }

  async create(createInboundDto: CreateInboundDto) {
    const { materialId, supplierId, quantity, unit, batchNumber: customBatchNumber, expiryDate, remark } = createInboundDto;

    // 检查原料是否存在
    const material = await this.prisma.material.findUnique({ where: { id: materialId } });
    if (!material) {
      throw new BadRequestException('原料不存在');
    }

    // 检查供应商是否存在
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      throw new BadRequestException('供应商不存在');
    }

    // 生成批次号
    const batchNumber = customBatchNumber || await this.batchGenerator.generateMaterialBatch();

    // 检查批次是否已存在
    const existingBatch = await this.prisma.materialBatch.findUnique({
      where: { batchNo: batchNumber },
    });
    if (existingBatch) {
      throw new BadRequestException('该批次号已存在');
    }

    // 开始事务
    return this.prisma.$transaction(async (prisma) => {
      // 创建原料批次
      const materialBatch = await prisma.materialBatch.create({
        data: {
          materialId,
          batchNo: batchNumber,
          quantity,
          unit,
          supplierId,
          expiryDate,
          inboundDate: new Date(),
          operatorId: 'SYSTEM',
        },
      });

      // 创建入库记录
      const inboundNo = `IN${Date.now()}`;
      const inbound = await prisma.inbound.create({
        data: {
          inboundNo,
          materialId,
          supplierId,
          quantity,
          unit,
          batchNumber,
          expiryDate,
          remark,
        },
      });

      // 检查是否已有库存记录
      const existingInventory = await prisma.inventory.findFirst({
        where: { materialId },
      });

      if (existingInventory) {
        // 更新现有库存
        await prisma.inventory.update({
          where: { id: existingInventory.id },
          data: {
            totalQty: existingInventory.totalQty.plus(quantity),
            availableQty: existingInventory.availableQty.plus(quantity),
          },
        });
      } else {
        // 创建新库存记录
        await prisma.inventory.create({
          data: {
            type: 'MATERIAL',
            materialId,
            totalQty: { toNumber: () => quantity } as any,
            availableQty: { toNumber: () => quantity } as any,
            unit: material.unit,
          },
        });
      }

      return inbound;
    });
  }
}
