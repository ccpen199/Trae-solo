import { databaseService } from './databaseService';
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
      const order = await databaseService.findUnique('order', { id: orderId });

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== 'PAYMENT_RECEIVED' && order.status !== 'SPLIT_IN_PROGRESS') {
        throw new Error(`订单状态不正确，当前状态: ${order.status}`);
      }

      const splitter = await databaseService.findUnique('user', { id: splitterId });

      // 只有在使用真实数据库时才验证拆单员角色
      if (!databaseService.isUsingMockData()) {
        if (!splitter || splitter.role !== 'SPLITTER') {
          throw new Error('拆单员不存在或角色不正确');
        }
      }

      const existingSplit = (await databaseService.findMany('split')).find((s: any) => s.orderId === orderId);

      if (existingSplit) {
        if (existingSplit.status === 'IN_PROGRESS') {
          return existingSplit;
        }
        throw new Error('该订单已存在拆单记录');
      }

      // 模拟事务操作
      const split = await databaseService.create('split', {
        orderId,
        splitterId,
        status: 'IN_PROGRESS' as SplitStatus,
        components: [],
        materialBom: [],
        hardwareBom: [],
        processingInstructions: [],
        drawings: []
      });

      await databaseService.update('order', { id: orderId }, { status: 'SPLIT_IN_PROGRESS' as any });

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
        metadata: { splitterName: splitter ? splitter.name : 'Test Splitter' }
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
      const split = await databaseService.findUnique('split', { id: splitId });

      if (!split) {
        throw new Error('拆单记录不存在');
      }

      if (split.splitterId !== splitterId) {
        throw new Error('拆单员无权限操作此拆单');
      }

      if (split.status !== 'IN_PROGRESS') {
        throw new Error(`拆单状态不正确，当前状态: ${split.status}`);
      }

      // 构建符合SplitInput结构的输入
      const splitInput = {
        orderId: split.orderId,
        designId: '',
        designData: {
          components: input.components || [],
          materials: [],
          hardware: []
        }
      };

      const splitResult = await splitEngine.executeSplit(splitInput);

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
      const split = await databaseService.findUnique('split', { id: splitId });

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

      const updatedSplit = await databaseService.update('split', { id: splitId }, {
        status: 'SUBMITTED' as SplitStatus,
        components,
        materialBom,
        hardwareBom,
        processingInstructions,
        drawings: drawings || [],
        notes,
        submittedAt: new Date()
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
      const split = await databaseService.findUnique('split', { id: splitId });

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

      // 模拟事务操作
      const updatedSplit = await databaseService.update('split', { id: splitId }, {
        status: approved ? 'APPROVED' as SplitStatus : 'REJECTED' as SplitStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectedReason: !approved ? rejectedReason : null
      });

      if (approved) {
        await databaseService.update('order', { id: split.orderId }, { status: 'SPLIT_COMPLETED' as any });
      }

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
    const split = await databaseService.findUnique('split', { id: splitId });
    if (!split) return null;
    
    // 模拟关联数据
    const order = await databaseService.findUnique('order', { id: split.orderId });
    const customer = order ? await databaseService.findUnique('user', { id: order.customerId }) : null;
    const quote = order ? await databaseService.findUnique('quote', { id: order.quoteId }) : null;
    const design = quote ? await databaseService.findUnique('design', { id: quote.designId }) : null;
    const designer = design ? await databaseService.findUnique('user', { id: design.designerId }) : null;
    const splitter = await databaseService.findUnique('user', { id: split.splitterId });
    
    return {
      ...split,
      order: order ? {
        ...order,
        customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null,
        quote: quote ? {
          ...quote,
          design: design ? {
            ...design,
            designer: designer ? { id: designer.id, name: designer.name } : null
          } : null
        } : null
      } : null,
      splitter: splitter ? { id: splitter.id, name: splitter.name, phone: splitter.phone } : null
    };
  }

  async getSplitByOrder(orderId: string): Promise<any> {
    const split = (await databaseService.findMany('split')).find((s: any) => s.orderId === orderId);
    if (!split) return null;
    
    const splitter = await databaseService.findUnique('user', { id: split.splitterId });
    
    return {
      ...split,
      splitter: splitter ? { id: splitter.id, name: splitter.name, phone: splitter.phone } : null
    };
  }

  async getSplitsBySplitter(splitterId: string, status?: SplitStatus): Promise<any[]> {
    const splits = await databaseService.findMany('split');
    let splitterSplits = splits.filter((s: any) => s.splitterId === splitterId);
    
    if (status) {
      splitterSplits = splitterSplits.filter((s: any) => s.status === status);
    }
    
    // 按创建时间倒序排序
    splitterSplits.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(splitterSplits.map(async (split: any) => {
      const order = await databaseService.findUnique('order', { id: split.orderId });
      return {
        ...split,
        order: order ? { id: order.id, orderNumber: order.orderNumber, title: order.title, status: order.status } : null
      };
    }));
  }

  async getSplitsForReview(): Promise<any[]> {
    const splits = await databaseService.findMany('split');
    const submittedSplits = splits.filter((s: any) => s.status === 'SUBMITTED');
    
    // 按提交时间正序排序
    submittedSplits.sort((a: any, b: any) => 
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(submittedSplits.map(async (split: any) => {
      const order = await databaseService.findUnique('order', { id: split.orderId });
      const customer = order ? await databaseService.findUnique('user', { id: order.customerId }) : null;
      const splitter = await databaseService.findUnique('user', { id: split.splitterId });
      return {
        ...split,
        order: order ? {
          ...order,
          customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null
        } : null,
        splitter: splitter ? { id: splitter.id, name: splitter.name, phone: splitter.phone } : null
      };
    }));
  }
}

export const splitService = new SplitService();
export default SplitService;
