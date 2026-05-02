import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Style } from '@/modules/styles/entities/style.entity';
import { StyleStatus } from '@/common/enums/style-status.enum';
import { PatternStatus } from '@/common/enums/pattern-status.enum';
import { BomStatus } from '@/common/enums/bom-status.enum';
import { PurchaseOrderStatus } from '@/common/enums/purchase-status.enum';
import { ProductionOrderStatus } from '@/common/enums/production-status.enum';
import { StyleHistory } from '@/modules/styles/entities/style-history.entity';

@Injectable()
export class ProcessFlowEngine {
  private readonly logger = new Logger(ProcessFlowEngine.name);

  constructor(
    @InjectRepository(Style)
    private styleRepository: Repository<Style>,
    @InjectRepository(StyleHistory)
    private styleHistoryRepository: Repository<StyleHistory>,
    private entityManager: EntityManager,
  ) {}

  private readonly statusTransitions = {
    [StyleStatus.DRAFT]: [StyleStatus.PENDING_PATTERN],
    [StyleStatus.PENDING_PATTERN]: [StyleStatus.PATTERN_IN_PROGRESS, StyleStatus.ON_HOLD],
    [StyleStatus.PATTERN_IN_PROGRESS]: [StyleStatus.PATTERN_SUBMITTED, StyleStatus.ON_HOLD],
    [StyleStatus.PATTERN_SUBMITTED]: [StyleStatus.PENDING_CONFIRMATION, StyleStatus.ON_HOLD],
    [StyleStatus.PENDING_CONFIRMATION]: [
      StyleStatus.CONFIRMED,
      StyleStatus.PATTERN_IN_PROGRESS,
      StyleStatus.ON_HOLD,
    ],
    [StyleStatus.CONFIRMED]: [StyleStatus.BOM_GENERATED, StyleStatus.ON_HOLD],
    [StyleStatus.BOM_GENERATED]: [StyleStatus.PENDING_PURCHASE, StyleStatus.ON_HOLD],
    [StyleStatus.PENDING_PURCHASE]: [StyleStatus.PURCHASE_IN_PROGRESS, StyleStatus.ON_HOLD],
    [StyleStatus.PURCHASE_IN_PROGRESS]: [StyleStatus.MATERIAL_READY, StyleStatus.ON_HOLD],
    [StyleStatus.MATERIAL_READY]: [StyleStatus.PENDING_PRODUCTION, StyleStatus.ON_HOLD],
    [StyleStatus.PENDING_PRODUCTION]: [StyleStatus.PRODUCTION_IN_PROGRESS, StyleStatus.ON_HOLD],
    [StyleStatus.PRODUCTION_IN_PROGRESS]: [
      StyleStatus.PRODUCTION_COMPLETED,
      StyleStatus.ON_HOLD,
    ],
    [StyleStatus.PRODUCTION_COMPLETED]: [StyleStatus.SHIPPED, StyleStatus.ON_HOLD],
    [StyleStatus.SHIPPED]: [StyleStatus.COMPLETED, StyleStatus.ON_HOLD],
    [StyleStatus.ON_HOLD]: [
      StyleStatus.PENDING_PATTERN,
      StyleStatus.PATTERN_IN_PROGRESS,
      StyleStatus.PATTERN_SUBMITTED,
      StyleStatus.PENDING_CONFIRMATION,
      StyleStatus.CONFIRMED,
      StyleStatus.BOM_GENERATED,
      StyleStatus.PENDING_PURCHASE,
      StyleStatus.PURCHASE_IN_PROGRESS,
      StyleStatus.MATERIAL_READY,
      StyleStatus.PENDING_PRODUCTION,
      StyleStatus.PRODUCTION_IN_PROGRESS,
      StyleStatus.PRODUCTION_COMPLETED,
      StyleStatus.SHIPPED,
      StyleStatus.COMPLETED,
    ],
  };

  async canTransition(
    currentStatus: StyleStatus,
    targetStatus: StyleStatus,
  ): Promise<boolean> {
    const allowedTransitions = this.statusTransitions[currentStatus] || [];
    return allowedTransitions.includes(targetStatus);
  }

  async transitionStyleStatus(
    styleId: string,
    targetStatus: StyleStatus,
    operatorId: string,
    actionDescription: string,
    changedFields?: { [key: string]: { old: any; new: any } },
    remarks?: string,
    attachmentUrls?: string[],
  ): Promise<Style> {
    return this.entityManager.transaction(async (manager) => {
      const style = await manager.findOne(Style, {
        where: { id: styleId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!style) {
        throw new Error(`款式不存在: ${styleId}`);
      }

      const canTransition = await this.canTransition(style.status, targetStatus);
      
      if (!canTransition && targetStatus !== StyleStatus.CANCELLED) {
        throw new Error(
          `状态转换不允许: ${style.status} -> ${targetStatus}`,
        );
      }

      const oldStatus = style.status;
      style.status = targetStatus;
      style.updatedBy = operatorId;

      const updatedStyle = await manager.save(style);

      const history = manager.create(StyleHistory, {
        styleId: style.id,
        operatorId,
        oldStatus,
        newStatus: targetStatus,
        actionType: 'STATUS_TRANSITION',
        actionDescription,
        changedFields,
        remarks,
        attachmentUrls,
      });

      await manager.save(history);

      this.logger.log(
        `款式 ${style.styleNumber} 状态变化: ${oldStatus} -> ${targetStatus}`,
      );

      return updatedStyle;
    });
  }

  async getNextPossibleStatuses(currentStatus: StyleStatus): Promise<StyleStatus[]> {
    return this.statusTransitions[currentStatus] || [];
  }

  mapPatternStatusToStyleStatus(patternStatus: PatternStatus): StyleStatus | null {
    const mapping: { [key in PatternStatus]?: StyleStatus } = {
      [PatternStatus.PENDING]: StyleStatus.PENDING_PATTERN,
      [PatternStatus.IN_PROGRESS]: StyleStatus.PATTERN_IN_PROGRESS,
      [PatternStatus.SUBMITTED]: StyleStatus.PENDING_CONFIRMATION,
      [PatternStatus.CONFIRMED]: StyleStatus.CONFIRMED,
      [PatternStatus.NEEDS_REVISION]: StyleStatus.PATTERN_IN_PROGRESS,
      [PatternStatus.REJECTED]: StyleStatus.PATTERN_IN_PROGRESS,
    };

    return mapping[patternStatus] || null;
  }

  mapBomStatusToStyleStatus(bomStatus: BomStatus): StyleStatus | null {
    const mapping: { [key in BomStatus]?: StyleStatus } = {
      [BomStatus.GENERATED]: StyleStatus.BOM_GENERATED,
      [BomStatus.CONFIRMED]: StyleStatus.PENDING_PURCHASE,
    };

    return mapping[bomStatus] || null;
  }

  mapPurchaseStatusToStyleStatus(
    purchaseStatus: PurchaseOrderStatus,
  ): StyleStatus | null {
    const mapping: { [key in PurchaseOrderStatus]?: StyleStatus } = {
      [PurchaseOrderStatus.APPROVED]: StyleStatus.PURCHASE_IN_PROGRESS,
      [PurchaseOrderStatus.FULLY_RECEIVED]: StyleStatus.MATERIAL_READY,
      [PurchaseOrderStatus.COMPLETED]: StyleStatus.MATERIAL_READY,
    };

    return mapping[purchaseStatus] || null;
  }

  mapProductionStatusToStyleStatus(
    productionStatus: ProductionOrderStatus,
  ): StyleStatus | null {
    const mapping: { [key in ProductionOrderStatus]?: StyleStatus } = {
      [ProductionOrderStatus.IN_PRODUCTION]: StyleStatus.PRODUCTION_IN_PROGRESS,
      [ProductionOrderStatus.COMPLETED]: StyleStatus.COMPLETED,
      [ProductionOrderStatus.SHIPPED]: StyleStatus.SHIPPED,
    };

    return mapping[productionStatus] || null;
  }

  async getStatusDescription(status: StyleStatus): Promise<{
    code: string;
    name: string;
    description: string;
    nextActions: string[];
  }> {
    const descriptions: {
      [key in StyleStatus]: {
        name: string;
        description: string;
        nextActions: string[];
      };
    } = {
      [StyleStatus.DRAFT]: {
        name: '草稿',
        description: '款式档案创建中，尚未提交',
        nextActions: ['提交款式档案给版师'],
      },
      [StyleStatus.PENDING_PATTERN]: {
        name: '待打版',
        description: '款式已提交，等待版师接单',
        nextActions: ['版师接单开始打版'],
      },
      [StyleStatus.PATTERN_IN_PROGRESS]: {
        name: '打版中',
        description: '版师正在进行打版工作',
        nextActions: ['提交打版成果'],
      },
      [StyleStatus.PATTERN_SUBMITTED]: {
        name: '打版已提交',
        description: '版师已提交打版成果',
        nextActions: ['等待设计师确认'],
      },
      [StyleStatus.PENDING_CONFIRMATION]: {
        name: '待确认',
        description: '等待设计师确认打版成果',
        nextActions: ['确认打版', '要求修改'],
      },
      [StyleStatus.CONFIRMED]: {
        name: '已确认',
        description: '设计师已确认打版成果',
        nextActions: ['生成BOM清单'],
      },
      [StyleStatus.BOM_GENERATED]: {
        name: 'BOM已生成',
        description: 'BOM清单已自动生成',
        nextActions: ['确认BOM并推送给采购'],
      },
      [StyleStatus.PENDING_PURCHASE]: {
        name: '待采购',
        description: '等待采购处理物料需求',
        nextActions: ['采购下单'],
      },
      [StyleStatus.PURCHASE_IN_PROGRESS]: {
        name: '采购中',
        description: '采购正在进行物料采购',
        nextActions: ['物料入库'],
      },
      [StyleStatus.MATERIAL_READY]: {
        name: '物料齐套',
        description: '所有物料已入库，等待生产',
        nextActions: ['安排生产'],
      },
      [StyleStatus.PENDING_PRODUCTION]: {
        name: '待生产',
        description: '等待工厂安排生产',
        nextActions: ['开始生产'],
      },
      [StyleStatus.PRODUCTION_IN_PROGRESS]: {
        name: '生产中',
        description: '工厂正在生产',
        nextActions: ['上报生产进度', '完成生产'],
      },
      [StyleStatus.PRODUCTION_COMPLETED]: {
        name: '生产完成',
        description: '生产已完成，等待出货',
        nextActions: ['申请出货'],
      },
      [StyleStatus.SHIPPED]: {
        name: '已出货',
        description: '产品已出货',
        nextActions: ['验收确认'],
      },
      [StyleStatus.COMPLETED]: {
        name: '已完成',
        description: '全流程已完成',
        nextActions: [],
      },
      [StyleStatus.CANCELLED]: {
        name: '已取消',
        description: '订单已取消',
        nextActions: [],
      },
      [StyleStatus.ON_HOLD]: {
        name: '暂停',
        description: '订单已暂停',
        nextActions: ['恢复订单'],
      },
    };

    const info = descriptions[status] || {
      name: status,
      description: '未知状态',
      nextActions: [],
    };

    return {
      code: status,
      ...info,
    };
  }
}
