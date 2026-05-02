import { databaseService } from './databaseService';
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

      const demand = await databaseService.create('demand', {
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
      const demand = await databaseService.findUnique('demand', { id: demandId });

      if (!demand) {
        throw new Error('需求不存在');
      }

      if (demand.status !== 'PENDING_ASSIGNMENT') {
        throw new Error(`需求状态不正确，当前状态: ${demand.status}`);
      }

      const designer = await databaseService.findUnique('user', { id: designerId });

      if (!designer || designer.role !== 'DESIGNER') {
        throw new Error('设计师不存在或角色不正确');
      }

      const previousState = { status: demand.status, designerId: demand.designerId };

      const updatedDemand = await databaseService.update('demand', { id: demandId }, {
        designerId,
        status: 'ASSIGNED' as DemandStatus,
        assignedAt: new Date()
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
    const demand = await databaseService.findUnique('demand', { id: demandId });
    if (!demand) return null;
    
    // 模拟关联数据
    const customer = await databaseService.findUnique('user', { id: demand.customerId });
    const designer = await databaseService.findUnique('user', { id: demand.designerId });
    const measurement = (await databaseService.findMany('measurement')).find((m: any) => m.demandId === demandId);
    const design = (await databaseService.findMany('design')).find((d: any) => d.demandId === demandId);
    const order = (await databaseService.findMany('order')).find((o: any) => o.demandId === demandId);
    
    return {
      ...demand,
      customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null,
      designer: designer ? { id: designer.id, name: designer.name, phone: designer.phone } : null,
      measurement,
      design,
      order
    };
  }

  async getDemandsByCustomer(customerId: string): Promise<any[]> {
    const demands = await databaseService.findMany('demand');
    const customerDemands = demands.filter((d: any) => d.customerId === customerId);
    
    // 按创建时间倒序排序
    customerDemands.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(customerDemands.map(async (demand: any) => {
      const designer = await databaseService.findUnique('user', { id: demand.designerId });
      const order = (await databaseService.findMany('order')).find((o: any) => o.demandId === demand.id);
      return {
        ...demand,
        designer: designer ? { id: designer.id, name: designer.name } : null,
        order: order ? { id: order.id, orderNumber: order.orderNumber, status: order.status } : null
      };
    }));
  }

  async getDemandsByDesigner(designerId: string, status?: DemandStatus): Promise<any[]> {
    const demands = await databaseService.findMany('demand');
    let designerDemands = demands.filter((d: any) => d.designerId === designerId);
    
    if (status) {
      designerDemands = designerDemands.filter((d: any) => d.status === status);
    }
    
    // 按创建时间倒序排序
    designerDemands.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(designerDemands.map(async (demand: any) => {
      const customer = await databaseService.findUnique('user', { id: demand.customerId });
      const measurement = (await databaseService.findMany('measurement')).find((m: any) => m.demandId === demand.id);
      const design = (await databaseService.findMany('design')).find((d: any) => d.demandId === demand.id);
      return {
        ...demand,
        customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null,
        measurement,
        design
      };
    }));
  }

  async getPendingDemands(): Promise<any[]> {
    const demands = await databaseService.findMany('demand');
    const pendingDemands = demands.filter((d: any) => d.status === 'PENDING_ASSIGNMENT');
    
    // 按创建时间正序排序
    pendingDemands.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(pendingDemands.map(async (demand: any) => {
      const customer = await databaseService.findUnique('user', { id: demand.customerId });
      return {
        ...demand,
        customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null
      };
    }));
  }

  private async generateDemandNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const demands = await databaseService.findMany('demand');
    const todayDemands = demands.filter((d: any) => {
      const dDate = new Date(d.createdAt);
      return dDate.getFullYear() === now.getFullYear() &&
        dDate.getMonth() === now.getMonth() &&
        dDate.getDate() === now.getDate();
    });

    const count = todayDemands.length;
    const sequence = (count + 1).toString().padStart(4, '0');
    return `XD${dateStr}${sequence}`;
  }
}

export const demandService = new DemandService();
export default DemandService;
