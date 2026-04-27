import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from './auditService';
import { exceptionService, ExceptionType } from './exceptionService';
import { orderFlowEngine } from '../engines/orderFlow';
import { DemandStatus, OrderStatus, UserRole } from '../types';

export interface CreateDemandParams {
  customerId: string;
  houseType?: string;
  area?: number;
  style?: string;
  budgetRange?: string;
  address: string;
  province?: string;
  city?: string;
  district?: string;
  contactName: string;
  contactPhone: string;
  description?: string;
  images?: string[];
}

export interface AssignDesignerParams {
  demandId: string;
  designerId: string;
  assignedBy: string;
  assignedByRole: UserRole;
}

export class DemandService {
  async createDemand(params: CreateDemandParams): Promise<any> {
    try {
      const demandNumber = await this.generateDemandNumber();

      const demand = await prisma.demand.create({
        data: {
          demandNumber,
          customerId: params.customerId,
          houseType: params.houseType,
          area: params.area,
          style: params.style,
          budgetRange: params.budgetRange,
          address: params.address,
          province: params.province,
          city: params.city,
          district: params.district,
          contactName: params.contactName,
          contactPhone: params.contactPhone,
          description: params.description,
          images: params.images || [],
          status: 'PENDING_ASSIGNMENT' as DemandStatus
        }
      });

      await auditService.createLog({
        entityType: 'Demand',
        entityId: demand.id,
        action: 'DEMAND_SUBMITTED',
        actorId: params.customerId,
        actorRole: 'CUSTOMER',
        newState: {
          id: demand.id,
          demandNumber: demand.demandNumber,
          status: demand.status,
          houseType: demand.houseType,
          style: demand.style,
          budgetRange: demand.budgetRange
        },
        reason: '客户提交定制需求'
      });

      logger.info(`[DemandService] 需求创建成功: ${demand.demandNumber}`);

      return demand;
    } catch (error: any) {
      await exceptionService.createException({
        exceptionType: 'BUSINESS_ERROR',
        message: `创建需求失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async assignDesigner(params: AssignDesignerParams): Promise<any> {
    const { demandId, designerId, assignedBy, assignedByRole } = params;

    try {
      const demand = await prisma.demand.findUnique({
        where: { id: demandId }
      });

      if (!demand) {
        throw new Error('需求不存在');
      }

      if (demand.status !== 'PENDING_ASSIGNMENT') {
        throw new Error(`需求状态不正确，当前状态: ${demand.status}`);
      }

      const designer = await prisma.user.findUnique({
        where: { id: designerId },
        include: { designerProfile: true }
      });

      if (!designer || designer.role !== 'DESIGNER') {
        throw new Error('设计师不存在或角色不正确');
      }

      if (!designer.designerProfile?.isAvailable) {
        throw new Error('设计师当前不可用');
      }

      const previousState = { status: demand.status, designerId: demand.designerId };

      const updatedDemand = await prisma.demand.update({
        where: { id: demandId },
        data: {
          designerId,
          status: 'ASSIGNED' as DemandStatus,
          assignedAt: new Date()
        }
      });

      await auditService.createLog({
        entityType: 'Demand',
        entityId: demandId,
        action: 'DESIGNER_ASSIGNED',
        actorId: assignedBy,
        actorRole: assignedByRole,
        previousState,
        newState: {
          status: updatedDemand.status,
          designerId: updatedDemand.designerId,
          assignedAt: updatedDemand.assignedAt
        },
        reason: '分配设计师给需求',
        metadata: { designerName: designer.name }
      });

      logger.info(`[DemandService] 需求 ${demandId} 分配设计师 ${designerId} 成功`);

      return updatedDemand;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: demandId,
        entityType: 'Demand',
        entityId: demandId,
        exceptionType: 'BUSINESS_ERROR',
        message: `分配设计师失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async getDemandById(demandId: string): Promise<any> {
    return prisma.demand.findUnique({
      where: { id: demandId },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        designer: {
          select: { id: true, name: true, phone: true },
          include: { designerProfile: true }
        },
        measurement: true,
        design: true,
        order: true
      }
    });
  }

  async getDemandsByCustomer(customerId: string): Promise<any[]> {
    return prisma.demand.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        designer: {
          select: { id: true, name: true }
        },
        order: {
          select: { id: true, orderNumber: true, status: true }
        }
      }
    });
  }

  async getDemandsByDesigner(designerId: string, status?: DemandStatus): Promise<any[]> {
    const where: any = { designerId };
    if (status) {
      where.status = status;
    }

    return prisma.demand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        measurement: true,
        design: true
      }
    });
  }

  async getPendingDemands(): Promise<any[]> {
    return prisma.demand.findMany({
      where: { status: 'PENDING_ASSIGNMENT' },
      orderBy: { createdAt: 'asc' },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        }
      }
    });
  }

  private async generateDemandNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const count = await prisma.demand.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `XD${dateStr}${sequence}`;
  }
}

export const demandService = new DemandService();
export default DemandService;
