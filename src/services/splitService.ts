import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from './auditService';
import { exceptionService, ExceptionType } from './exceptionService';
import { splitEngine } from '../engines/split';
import { SplitStatus, UserRole, SplitContext, SplitComponent } from '../types';

export interface StartSplitParams {
  orderId: string;
  splitterId: string;
}

export interface SubmitSplitParams {
  splitId: string;
  splitterId: string;
  components: SplitComponent[];
  materialBom: any[];
  hardwareBom: any[];
  processingInstructions: any[];
  drawings?: string[];
  notes?: string;
}

export interface ReviewSplitParams {
  splitId: string;
  reviewerId: string;
  reviewerRole: UserRole;
  approved: boolean;
  rejectedReason?: string;
}

export class SplitService {
  async startSplit(params: StartSplitParams): Promise<any> {
    const { orderId, splitterId } = params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          quote: {
            include: {
              design: true
            }
          }
        }
      });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'PAYMENT_RECEIVED' && order.status !== 'SPLIT_IN_PROGRESS') {
        throw new Error(`订单状态不正确，当前状态: ${order.status}`);
      }

      const splitter = await prisma.user.findUnique({
        where: { id: splitterId },
        include: { splitterProfile: true }
      });

      if (!splitter || splitter.role !== 'SPLITTER') {
        throw new Error('拆单员不存在或角色不正确');
      }

      if (!splitter.splitterProfile?.isAvailable) {
        throw new Error('拆单员当前不可用');
      }

      const existingSplit = await prisma.split.findUnique({
        where: { orderId }
      });

      if (existingSplit) {
        if (existingSplit.status === 'IN_PROGRESS') {
          return existingSplit;
        }
        throw new Error('该订单已存在拆单记录');
      }

      const split = await prisma.$transaction(async (tx) => {
        const newSplit = await tx.split.create({
          data: {
            orderId,
            splitterId,
            status: 'IN_PROGRESS' as SplitStatus,
            components: [],
            materialBom: [],
            hardwareBom: [],
            processingInstructions: [],
            drawings: []
          }
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'SPLIT_IN_PROGRESS' as any }
        });

        return newSplit;
      });

      await auditService.createLog({
        entityType: 'Split',
        entityId: split.id,
        action: 'SPLIT_STARTED',
        actorId: splitterId,
        actorRole: 'SPLITTER',
        newState: {
          id: split.id,
          orderId,
          status: split.status
        },
        reason: '开始拆单工作',
        metadata: { splitterName: splitter.name }
      });

      logger.info(`[SplitService] 拆单开始: orderId=${orderId}, splitterId=${splitterId}`);

      return split;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: params.orderId,
        entityType: 'Split',
        exceptionType: 'SPLIT_ERROR',
        message: `开始拆单失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async executeSplit(splitId: string, splitterId: string, input: any): Promise<any> {
    try {
      const split = await prisma.split.findUnique({
        where: { id: splitId }
      });

      if (!split) {
        throw new Error('拆单记录不存在');
      }

      if (split.splitterId !== splitterId) {
        throw new Error('拆单员无权限操作此拆单');
      }

      if (split.status !== 'IN_PROGRESS') {
        throw new Error(`拆单状态不正确，当前状态: ${split.status}`);
      }

      const splitContext: SplitContext = {
        orderId: split.orderId,
        designId: '',
        components: input.components || [],
        materialBom: [],
        hardwareBom: [],
        processingInstructions: []
      };

      const splitResult = splitEngine.executeSplit(splitContext);

      logger.info(`[SplitService] 拆单计算完成: splitId=${splitId}, components=${splitResult.components.length}`);

      return splitResult;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Split',
        entityId: splitId,
        exceptionType: 'SPLIT_ERROR',
        message: `执行拆单失败: ${error.message}`,
        context: { splitId, splitterId },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async submitSplit(params: SubmitSplitParams): Promise<any> {
    const { splitId, splitterId, components, materialBom, hardwareBom, processingInstructions, drawings, notes } = params;

    try {
      const split = await prisma.split.findUnique({
        where: { id: splitId }
      });

      if (!split) {
        throw new Error('拆单记录不存在');
      }

      if (split.splitterId !== splitterId) {
        throw new Error('拆单员无权限操作此拆单');
      }

      if (split.status !== 'IN_PROGRESS') {
        throw new Error(`拆单状态不正确，当前状态: ${split.status}`);
      }

      const previousState = {
        status: split.status,
        components: split.components,
        materialBom: split.materialBom
      };

      const updatedSplit = await prisma.split.update({
        where: { id: splitId },
        data: {
          status: 'SUBMITTED' as SplitStatus,
          components,
          materialBom,
          hardwareBom,
          processingInstructions,
          drawings: drawings || [],
          notes,
          submittedAt: new Date()
        }
      });

      await auditService.createLog({
        entityType: 'Split',
        entityId: splitId,
        action: 'SPLIT_SUBMITTED',
        actorId: splitterId,
        actorRole: 'SPLITTER',
        previousState,
        newState: {
          status: updatedSplit.status,
          submittedAt: updatedSplit.submittedAt,
          componentsCount: components.length
        },
        reason: '提交拆单结果',
        metadata: {
          componentsCount: components.length,
          materialBomCount: materialBom.length,
          hardwareBomCount: hardwareBom.length
        }
      });

      logger.info(`[SplitService] 拆单提交成功: splitId=${splitId}`);

      return updatedSplit;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Split',
        entityId: params.splitId,
        exceptionType: 'SPLIT_ERROR',
        message: `提交拆单失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async reviewSplit(params: ReviewSplitParams): Promise<any> {
    const { splitId, reviewerId, reviewerRole, approved, rejectedReason } = params;

    try {
      const split = await prisma.split.findUnique({
        where: { id: splitId }
      });

      if (!split) {
        throw new Error('拆单记录不存在');
      }

      if (split.status !== 'SUBMITTED') {
        throw new Error(`拆单状态不正确，当前状态: ${split.status}`);
      }

      const previousState = {
        status: split.status,
        reviewedBy: split.reviewedBy,
        reviewedAt: split.reviewedAt
      };

      const updatedSplit = await prisma.$transaction(async (tx) => {
        const newSplit = await tx.split.update({
          where: { id: splitId },
          data: {
            status: approved ? 'APPROVED' as SplitStatus : 'REJECTED' as SplitStatus,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            rejectedReason: !approved ? rejectedReason : null
          }
        });

        if (approved) {
          await tx.order.update({
            where: { id: split.orderId },
            data: { status: 'SPLIT_COMPLETED' as any }
          });
        }

        return newSplit;
      });

      await auditService.createLog({
        entityType: 'Split',
        entityId: splitId,
        action: approved ? 'SPLIT_APPROVED' : 'SPLIT_REJECTED',
        actorId: reviewerId,
        actorRole: reviewerRole,
        previousState,
        newState: {
          status: updatedSplit.status,
          reviewedBy: updatedSplit.reviewedBy,
          reviewedAt: updatedSplit.reviewedAt
        },
        reason: approved ? '拆单审核通过' : '拆单审核拒绝',
        metadata: { rejectedReason }
      });

      logger.info(`[SplitService] 拆单审核完成: splitId=${splitId}, approved=${approved}`);

      return updatedSplit;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Split',
        entityId: params.splitId,
        exceptionType: 'SPLIT_ERROR',
        message: `审核拆单失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async getSplitById(splitId: string): Promise<any> {
    return prisma.split.findUnique({
      where: { id: splitId },
      include: {
        order: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            quote: {
              include: {
                design: {
                  include: {
                    designer: { select: { id: true, name: true } }
                  }
                }
              }
            }
          }
        },
        splitter: { select: { id: true, name: true, phone: true } }
      }
    });
  }

  async getSplitByOrder(orderId: string): Promise<any> {
    return prisma.split.findUnique({
      where: { orderId },
      include: {
        splitter: { select: { id: true, name: true, phone: true } }
      }
    });
  }

  async getSplitsBySplitter(splitterId: string, status?: SplitStatus): Promise<any[]> {
    const where: any = { splitterId };
    if (status) {
      where.status = status;
    }

    return prisma.split.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { id: true, orderNumber: true, title: true, status: true }
        }
      }
    });
  }

  async getSplitsForReview(): Promise<any[]> {
    return prisma.split.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { submittedAt: 'asc' },
      include: {
        order: {
          select: { id: true, orderNumber: true, title: true },
          include: {
            customer: { select: { id: true, name: true, phone: true } }
          }
        },
        splitter: { select: { id: true, name: true, phone: true } }
      }
    });
  }
}

export const splitService = new SplitService();
export default SplitService;
