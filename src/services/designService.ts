import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from './auditService';
import { exceptionService, ExceptionType } from './exceptionService';
import { DesignStatus, UserRole } from '../types';

export interface CreateDesignParams {
  demandId: string;
  designerId: string;
  title: string;
  description?: string;
}

export interface SubmitDesignParams {
  designId: string;
  designerId: string;
  title?: string;
  description?: string;
  renderings?: string[];
  blueprints?: string[];
  designData?: Record<string, any>;
}

export interface ReviewDesignParams {
  designId: string;
  reviewerId: string;
  reviewerRole: UserRole;
  approved: boolean;
  rejectedReason?: string;
}

export class DesignService {
  async createDesign(params: CreateDesignParams): Promise<any> {
    const { demandId, designerId, title, description } = params;

    try {
      const demand = await prisma.demand.findUnique({
        where: { id: demandId },
        include: { measurement: true }
      });

      if (!demand) {
        throw new Error('需求不存在');
      }

      if (demand.designerId !== designerId) {
        throw new Error('设计师无权限操作此需求');
      }

      if (demand.status !== 'MEASURED' && demand.status !== 'DESIGNING') {
        throw new Error(`需求状态不正确，当前状态: ${demand.status}`);
      }

      const existingDesign = await prisma.design.findUnique({
        where: { demandId }
      });

      if (existingDesign) {
        throw new Error('该需求已存在设计方案');
      }

      const design = await prisma.design.create({
        data: {
          demandId,
          designerId,
          title,
          description,
          status: 'IN_PROGRESS' as DesignStatus,
          renderings: [],
          blueprints: [],
          designData: {}
        }
      });

      await prisma.demand.update({
        where: { id: demandId },
        data: { status: 'DESIGNING' as any }
      });

      await auditService.createLog({
        entityType: 'Design',
        entityId: design.id,
        action: 'DESIGN_STARTED',
        actorId: designerId,
        actorRole: 'DESIGNER',
        newState: {
          id: design.id,
          demandId,
          title: design.title,
          status: design.status
        },
        reason: '开始方案设计'
      });

      logger.info(`[DesignService] 设计创建成功: demandId=${demandId}`);

      return design;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: demandId,
        entityType: 'Design',
        exceptionType: 'BUSINESS_ERROR',
        message: `创建设计失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async updateDesign(designId: string, designerId: string, updates: {
    title?: string;
    description?: string;
    renderings?: string[];
    blueprints?: string[];
    designData?: Record<string, any>;
  }): Promise<any> {
    try {
      const design = await prisma.design.findUnique({
        where: { id: designId }
      });

      if (!design) {
        throw new Error('设计方案不存在');
      }

      if (design.designerId !== designerId) {
        throw new Error('设计师无权限操作此设计');
      }

      if (design.status !== 'IN_PROGRESS') {
        throw new Error(`设计状态不正确，当前状态: ${design.status}`);
      }

      const previousState = {
        title: design.title,
        description: design.description,
        renderings: design.renderings,
        blueprints: design.blueprints
      };

      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.renderings !== undefined) updateData.renderings = updates.renderings;
      if (updates.blueprints !== undefined) updateData.blueprints = updates.blueprints;
      if (updates.designData !== undefined) updateData.designData = updates.designData;

      const updatedDesign = await prisma.design.update({
        where: { id: designId },
        data: updateData
      });

      await auditService.createLog({
        entityType: 'Design',
        entityId: designId,
        action: 'DESIGN_UPDATED',
        actorId: designerId,
        actorRole: 'DESIGNER',
        previousState,
        newState: {
          title: updatedDesign.title,
          description: updatedDesign.description
        },
        reason: '更新设计方案'
      });

      logger.info(`[DesignService] 设计更新成功: designId=${designId}`);

      return updatedDesign;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Design',
        entityId: designId,
        exceptionType: 'BUSINESS_ERROR',
        message: `更新设计失败: ${error.message}`,
        context: { designId, designerId, updates },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async submitDesign(params: SubmitDesignParams): Promise<any> {
    const { designId, designerId, title, description, renderings, blueprints, designData } = params;

    try {
      const design = await prisma.design.findUnique({
        where: { id: designId }
      });

      if (!design) {
        throw new Error('设计方案不存在');
      }

      if (design.designerId !== designerId) {
        throw new Error('设计师无权限操作此设计');
      }

      if (design.status !== 'IN_PROGRESS') {
        throw new Error(`设计状态不正确，当前状态: ${design.status}`);
      }

      const previousState = {
        status: design.status,
        title: design.title,
        description: design.description
      };

      const updateData: any = {
        status: 'SUBMITTED' as DesignStatus,
        submittedAt: new Date()
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (renderings !== undefined) updateData.renderings = renderings;
      if (blueprints !== undefined) updateData.blueprints = blueprints;
      if (designData !== undefined) updateData.designData = designData;

      const updatedDesign = await prisma.design.update({
        where: { id: designId },
        data: updateData
      });

      await prisma.demand.update({
        where: { id: updatedDesign.demandId },
        data: { status: 'DESIGNING' as any }
      });

      await auditService.createLog({
        entityType: 'Design',
        entityId: designId,
        action: 'DESIGN_SUBMITTED',
        actorId: designerId,
        actorRole: 'DESIGNER',
        previousState,
        newState: {
          status: updatedDesign.status,
          submittedAt: updatedDesign.submittedAt,
          title: updatedDesign.title
        },
        reason: '提交设计方案'
      });

      logger.info(`[DesignService] 设计提交成功: designId=${designId}`);

      return updatedDesign;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Design',
        entityId: designId,
        exceptionType: 'BUSINESS_ERROR',
        message: `提交设计失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async reviewDesign(params: ReviewDesignParams): Promise<any> {
    const { designId, reviewerId, reviewerRole, approved, rejectedReason } = params;

    try {
      const design = await prisma.design.findUnique({
        where: { id: designId }
      });

      if (!design) {
        throw new Error('设计方案不存在');
      }

      if (design.status !== 'SUBMITTED') {
        throw new Error(`设计状态不正确，当前状态: ${design.status}`);
      }

      const previousState = {
        status: design.status,
        reviewedBy: design.reviewedBy,
        reviewedAt: design.reviewedAt
      };

      const updatedDesign = await prisma.design.update({
        where: { id: designId },
        data: {
          status: approved ? 'APPROVED' as DesignStatus : 'REJECTED' as DesignStatus,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          rejectedReason: !approved ? rejectedReason : null
        }
      });

      await auditService.createLog({
        entityType: 'Design',
        entityId: designId,
        action: approved ? 'DESIGN_APPROVED' : 'DESIGN_REJECTED',
        actorId: reviewerId,
        actorRole: reviewerRole,
        previousState,
        newState: {
          status: updatedDesign.status,
          reviewedBy: updatedDesign.reviewedBy,
          reviewedAt: updatedDesign.reviewedAt
        },
        reason: approved ? '设计方案审核通过' : '设计方案审核拒绝',
        metadata: { rejectedReason }
      });

      logger.info(`[DesignService] 设计审核完成: designId=${designId}, approved=${approved}`);

      return updatedDesign;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Design',
        entityId: designId,
        exceptionType: 'BUSINESS_ERROR',
        message: `审核设计失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async getDesignById(designId: string): Promise<any> {
    return prisma.design.findUnique({
      where: { id: designId },
      include: {
        demand: {
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            measurement: true
          }
        },
        designer: {
          select: { id: true, name: true, phone: true }
        },
        quote: true
      }
    });
  }

  async getDesignsByDesigner(designerId: string, status?: DesignStatus): Promise<any[]> {
    const where: any = { designerId };
    if (status) {
      where.status = status;
    }

    return prisma.design.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        demand: {
          select: { id: true, demandNumber: true, address: true }
        }
      }
    });
  }

  async getDesignsForReview(): Promise<any[]> {
    return prisma.design.findMany({
      where: { status: 'SUBMITTED' },
      orderBy: { submittedAt: 'asc' },
      include: {
        demand: {
          select: { id: true, demandNumber: true, address: true },
          include: {
            customer: { select: { id: true, name: true, phone: true } }
          }
        },
        designer: {
          select: { id: true, name: true, phone: true }
        }
      }
    });
  }
}

export const designService = new DesignService();
export default DesignService;
