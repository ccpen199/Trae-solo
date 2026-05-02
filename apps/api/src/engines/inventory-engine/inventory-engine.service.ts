import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import Redis from 'ioredis';

type InventoryType = 'MATERIAL' | 'PRODUCT';
type InventoryOpType = 'INBOUND' | 'OUTBOUND' | 'ADJUST';

export interface InventoryOpResult {
  inventoryId: string;
  beforeQty: number;
  changeQty: number;
  afterQty: number;
  availableBefore: number;
  availableAfter: number;
  unit: string;
  logId: string;
}

@Injectable()
export class InventoryEngineService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async lockMaterial(materialId: string, quantity: number): Promise<boolean> {
    const lockKey = `lock:inventory:material:${materialId}`;
    const result = await this.redis.set(lockKey, '1');
    return result === 'OK';
  }

  async unlockMaterial(materialId: string): Promise<void> {
    const lockKey = `lock:inventory:material:${materialId}`;
    await this.redis.del(lockKey);
  }

  async getAvailableQuantity(
    type: InventoryType,
    id: string,
  ): Promise<number> {
    const inventory = await this.prisma.inventory.findFirst({
      where:
        type === 'MATERIAL'
          ? { type: 'MATERIAL', materialId: id }
          : { type: 'PRODUCT', productId: id },
    });

    if (!inventory) return 0;
    return inventory.availableQty.toNumber();
  }

  async checkSufficient(
    type: InventoryType,
    id: string,
    requiredQty: number,
  ): Promise<{ sufficient: boolean; available: number }> {
    const available = await this.getAvailableQuantity(type, id);
    return {
      sufficient: available >= requiredQty,
      available,
    };
  }

  async deductMaterial(
    materialId: string,
    quantity: number,
    operatorId: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<InventoryOpResult> {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findFirst({
        where: { type: 'MATERIAL', materialId },
      });

      if (!inventory) {
        throw new BadRequestException(`原料 ${materialId} 库存记录不存在`);
      }

      const available = inventory.availableQty.toNumber();
      if (available < quantity) {
        throw new ConflictException(`原料库存不足，可用: ${available}, 需要: ${quantity}`);
      }

      const beforeQty = inventory.totalQty.toNumber();
      const availableBefore = available;

      const updated = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          totalQty: { decrement: quantity },
          availableQty: { decrement: quantity },
          lastUpdatedAt: new Date(),
        },
      });

      const log = await tx.inventoryLog.create({
        data: {
          inventoryId: inventory.id,
          opType: 'OUTBOUND',
          beforeQty,
          changeQty: -quantity,
          afterQty: updated.totalQty.toNumber(),
          unit: inventory.unit,
          referenceType,
          referenceId,
          operatorId,
          operatedAt: new Date(),
        },
      });

      return {
        inventoryId: inventory.id,
        beforeQty,
        changeQty: -quantity,
        afterQty: updated.totalQty.toNumber(),
        availableBefore,
        availableAfter: updated.availableQty.toNumber(),
        unit: inventory.unit,
        logId: log.id,
      };
    });
  }

  async addMaterial(
    materialId: string,
    quantity: number,
    unit: string,
    operatorId: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<InventoryOpResult> {
    return this.prisma.$transaction(async (tx) => {
      let inventory = await tx.inventory.findFirst({
        where: { type: 'MATERIAL', materialId },
      });

      const beforeQty = inventory?.totalQty.toNumber() || 0;
      const availableBefore = inventory?.availableQty.toNumber() || 0;

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            type: 'MATERIAL',
            materialId,
            totalQty: quantity,
            availableQty: quantity,
            unit,
            lastUpdatedAt: new Date(),
          },
        });
      } else {
        inventory = await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            totalQty: { increment: quantity },
            availableQty: { increment: quantity },
            unit,
            lastUpdatedAt: new Date(),
          },
        });
      }

      const log = await tx.inventoryLog.create({
        data: {
          inventoryId: inventory.id,
          opType: 'INBOUND',
          beforeQty,
          changeQty: quantity,
          afterQty: inventory.totalQty.toNumber(),
          unit,
          referenceType,
          referenceId,
          operatorId,
          operatedAt: new Date(),
        },
      });

      return {
        inventoryId: inventory.id,
        beforeQty,
        changeQty: quantity,
        afterQty: inventory.totalQty.toNumber(),
        availableBefore,
        availableAfter: inventory.availableQty.toNumber(),
        unit,
        logId: log.id,
      };
    });
  }

  async addProduct(
    productId: string,
    quantity: number,
    unit: string,
    operatorId: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<InventoryOpResult> {
    return this.prisma.$transaction(async (tx) => {
      let inventory = await tx.inventory.findFirst({
        where: { type: 'PRODUCT', productId },
      });

      const beforeQty = inventory?.totalQty.toNumber() || 0;
      const availableBefore = inventory?.availableQty.toNumber() || 0;

      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            type: 'PRODUCT',
            productId,
            totalQty: quantity,
            availableQty: quantity,
            unit,
            lastUpdatedAt: new Date(),
          },
        });
      } else {
        inventory = await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            totalQty: { increment: quantity },
            availableQty: { increment: quantity },
            unit,
            lastUpdatedAt: new Date(),
          },
        });
      }

      const log = await tx.inventoryLog.create({
        data: {
          inventoryId: inventory.id,
          opType: 'INBOUND',
          beforeQty,
          changeQty: quantity,
          afterQty: inventory.totalQty.toNumber(),
          unit,
          referenceType,
          referenceId,
          operatorId,
          operatedAt: new Date(),
        },
      });

      return {
        inventoryId: inventory.id,
        beforeQty,
        changeQty: quantity,
        afterQty: inventory.totalQty.toNumber(),
        availableBefore,
        availableAfter: inventory.availableQty.toNumber(),
        unit,
        logId: log.id,
      };
    });
  }

  async deductProduct(
    productId: string,
    quantity: number,
    operatorId: string,
    referenceType?: string,
    referenceId?: string,
  ): Promise<InventoryOpResult> {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findFirst({
        where: { type: 'PRODUCT', productId },
      });

      if (!inventory) {
        throw new BadRequestException(`产品 ${productId} 库存记录不存在`);
      }

      const available = inventory.availableQty.toNumber();
      if (available < quantity) {
        throw new ConflictException(`产品库存不足，可用: ${available}, 需要: ${quantity}`);
      }

      const beforeQty = inventory.totalQty.toNumber();
      const availableBefore = available;

      const updated = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          totalQty: { decrement: quantity },
          availableQty: { decrement: quantity },
          lastUpdatedAt: new Date(),
        },
      });

      const log = await tx.inventoryLog.create({
        data: {
          inventoryId: inventory.id,
          opType: 'OUTBOUND',
          beforeQty,
          changeQty: -quantity,
          afterQty: updated.totalQty.toNumber(),
          unit: inventory.unit,
          referenceType,
          referenceId,
          operatorId,
          operatedAt: new Date(),
        },
      });

      return {
        inventoryId: inventory.id,
        beforeQty,
        changeQty: -quantity,
        afterQty: updated.totalQty.toNumber(),
        availableBefore,
        availableAfter: updated.availableQty.toNumber(),
        unit: inventory.unit,
        logId: log.id,
      };
    });
  }
}
