import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ProductionOrder } from '../../production/entities/production-order.entity';
import { ProductionProgress } from '../../production/entities/production-progress.entity';
import { ProductionOrderStatus } from '../../common/enums/production-status.enum';

@Injectable()
export class ProductionSyncEngine {
  private readonly logger = new Logger(ProductionSyncEngine.name);

  constructor(
    @InjectRepository(ProductionOrder)
    private productionOrderRepository: Repository<ProductionOrder>,
    @InjectRepository(ProductionProgress)
    private productionProgressRepository: Repository<ProductionProgress>,
    private entityManager: EntityManager,
  ) {}

  async updateProductionProgress(
    productionOrderId: string,
    stage: string,
    stageOrder: number,
    quantityStarted: number,
    quantityCompleted: number,
    quantityRejected: number,
    reporterId: string,
    notes?: string,
    imageUrls?: string[],
  ): Promise<ProductionProgress> {
    return this.entityManager.transaction(async (manager) => {
      const productionOrder = await manager.findOne(ProductionOrder, {
        where: { id: productionOrderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!productionOrder) {
        throw new Error(`生产工单不存在: ${productionOrderId}`);
      }

      let progress = await manager.findOne(ProductionProgress, {
        where: {
          productionOrderId,
          stage,
        },
      });

      if (!progress) {
        progress = manager.create(ProductionProgress, {
          productionOrderId,
          stage,
          stageOrder,
          status: 'in_progress',
          quantityStarted: 0,
          quantityCompleted: 0,
          quantityRejected: 0,
          progressPercentage: 0,
          reportedBy: reporterId,
        });
      }

      progress.quantityStarted = quantityStarted;
      progress.quantityCompleted = quantityCompleted;
      progress.quantityRejected = quantityRejected;

      if (productionOrder.orderQuantity > 0) {
        progress.progressPercentage =
          (quantityCompleted / productionOrder.orderQuantity) * 100;
      }

      if (quantityCompleted >= productionOrder.orderQuantity) {
        progress.status = 'completed';
        progress.completedAt = new Date();
      }

      if (notes) {
        progress.notes = notes;
      }

      if (imageUrls && imageUrls.length > 0) {
        if (!progress.imageUrls) {
          progress.imageUrls = [];
        }
        progress.imageUrls = [...progress.imageUrls, ...imageUrls];
      }

      const savedProgress = await manager.save(progress);

      await this.recalculateProductionOrderStatus(
        manager,
        productionOrder,
      );

      this.logger.log(
        `生产工单 ${productionOrder.poNumber} 进度更新: ${stage} - 完成 ${quantityCompleted}/${productionOrder.orderQuantity}`,
      );

      return savedProgress;
    });
  }

  private async recalculateProductionOrderStatus(
    manager: EntityManager,
    productionOrder: ProductionOrder,
  ): Promise<void> {
    const progresses = await manager.find(ProductionProgress, {
      where: { productionOrderId: productionOrder.id },
      order: { stageOrder: 'ASC' },
    });

    if (progresses.length === 0) {
      return;
    }

    let totalCompleted = 0;
    let totalRejected = 0;
    let allStagesCompleted = true;

    progresses.forEach((progress) => {
      if (progress.quantityCompleted > totalCompleted) {
        totalCompleted = progress.quantityCompleted;
      }
      totalRejected += progress.quantityRejected;

      if (progress.status !== 'completed') {
        allStagesCompleted = false;
      }
    });

    productionOrder.quantityProduced = totalCompleted;
    productionOrder.quantityRejected = totalRejected;
    productionOrder.quantityQualityPassed = totalCompleted - totalRejected;

    if (productionOrder.orderQuantity > 0) {
      productionOrder.progressPercentage =
        (totalCompleted / productionOrder.orderQuantity) * 100;
    }

    if (allStagesCompleted && totalCompleted >= productionOrder.orderQuantity) {
      if (productionOrder.status !== ProductionOrderStatus.PRODUCTION_COMPLETED) {
        productionOrder.status = ProductionOrderStatus.PRODUCTION_COMPLETED;
        productionOrder.completedAt = new Date();
      }
    } else if (totalCompleted > 0) {
      if (productionOrder.status !== ProductionOrderStatus.IN_PRODUCTION) {
        productionOrder.status = ProductionOrderStatus.IN_PRODUCTION;
        if (!productionOrder.startedAt) {
          productionOrder.startedAt = new Date();
        }
      }
    }

    await manager.save(productionOrder);
  }

  async getProductionDashboard(
    productionOrderId: string,
  ): Promise<{
    productionOrder: ProductionOrder;
    progresses: ProductionProgress[];
    summary: {
      totalQuantity: number;
      completedQuantity: number;
      rejectedQuantity: number;
      passedQuantity: number;
      progressPercentage: number;
      estimatedCompletionDate: Date | null;
    };
  }> {
    const productionOrder = await this.productionOrderRepository.findOne({
      where: { id: productionOrderId },
    });

    if (!productionOrder) {
      throw new Error(`生产工单不存在: ${productionOrderId}`);
    }

    const progresses = await this.productionProgressRepository.find({
      where: { productionOrderId },
      order: { stageOrder: 'ASC', createdAt: 'DESC' },
    });

    let totalCompleted = 0;
    let totalRejected = 0;

    progresses.forEach((progress) => {
      if (progress.quantityCompleted > totalCompleted) {
        totalCompleted = progress.quantityCompleted;
      }
      totalRejected += progress.quantityRejected;
    });

    const progressPercentage =
      productionOrder.orderQuantity > 0
        ? (totalCompleted / productionOrder.orderQuantity) * 100
        : 0;

    return {
      productionOrder,
      progresses,
      summary: {
        totalQuantity: productionOrder.orderQuantity,
        completedQuantity: totalCompleted,
        rejectedQuantity: totalRejected,
        passedQuantity: totalCompleted - totalRejected,
        progressPercentage,
        estimatedCompletionDate: productionOrder.scheduledEndDate || null,
      },
    };
  }

  async startProduction(
    productionOrderId: string,
    operatorId: string,
  ): Promise<ProductionOrder> {
    return this.entityManager.transaction(async (manager) => {
      const productionOrder = await manager.findOne(ProductionOrder, {
        where: { id: productionOrderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!productionOrder) {
        throw new Error(`生产工单不存在: ${productionOrderId}`);
      }

      if (
        productionOrder.status !== ProductionOrderStatus.PENDING_PRODUCTION &&
        productionOrder.status !== ProductionOrderStatus.SCHEDULED
      ) {
        throw new Error(`生产工单状态不允许开始生产: ${productionOrder.status}`);
      }

      productionOrder.status = ProductionOrderStatus.IN_PRODUCTION;
      productionOrder.startedAt = new Date();
      productionOrder.updatedBy = operatorId;

      const updatedOrder = await manager.save(productionOrder);

      this.logger.log(
        `生产工单 ${productionOrder.poNumber} 已开始生产`,
      );

      return updatedOrder;
    });
  }

  async completeProduction(
    productionOrderId: string,
    operatorId: string,
    notes?: string,
  ): Promise<ProductionOrder> {
    return this.entityManager.transaction(async (manager) => {
      const productionOrder = await manager.findOne(ProductionOrder, {
        where: { id: productionOrderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!productionOrder) {
        throw new Error(`生产工单不存在: ${productionOrderId}`);
      }

      if (productionOrder.status !== ProductionOrderStatus.IN_PRODUCTION) {
        throw new Error(`生产工单状态不允许完成: ${productionOrder.status}`);
      }

      productionOrder.status = ProductionOrderStatus.PRODUCTION_COMPLETED;
      productionOrder.completedAt = new Date();
      productionOrder.quantityProduced = productionOrder.orderQuantity;
      productionOrder.quantityQualityPassed =
        productionOrder.orderQuantity - productionOrder.quantityRejected;
      productionOrder.progressPercentage = 100;
      productionOrder.updatedBy = operatorId;

      if (notes) {
        productionOrder.notes = productionOrder.notes
          ? `${productionOrder.notes}\n${notes}`
          : notes;
      }

      const updatedOrder = await manager.save(productionOrder);

      this.logger.log(
        `生产工单 ${productionOrder.poNumber} 已完成生产`,
      );

      return updatedOrder;
    });
  }

  async calculateDailyProgress(
    productionOrderId: string,
    date: Date,
  ): Promise<{
    date: Date;
    quantityStarted: number;
    quantityCompleted: number;
    quantityRejected: number;
  }> {
    const progresses = await this.productionProgressRepository
      .createQueryBuilder('p')
      .where('p.productionOrderId = :productionOrderId', { productionOrderId })
      .andWhere('DATE(p.createdAt) = DATE(:date)', { date })
      .getMany();

    let quantityStarted = 0;
    let quantityCompleted = 0;
    let quantityRejected = 0;

    progresses.forEach((p) => {
      quantityStarted += p.quantityStarted;
      quantityCompleted += p.quantityCompleted;
      quantityRejected += p.quantityRejected;
    });

    return {
      date,
      quantityStarted,
      quantityCompleted,
      quantityRejected,
    };
  }
}
