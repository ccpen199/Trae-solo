import prisma from '../config/database';
import logger from '../config/logger';
import { auditService } from './auditService';
import { exceptionService, ExceptionType } from './exceptionService';
import { MeasurementStatus, UserRole } from '../types';

export interface CreateMeasurementParams {
  demandId: string;
  designerId: string;
  scheduledDate: Date;
}

export interface CompleteMeasurementParams {
  measurementId: string;
  designerId: string;
  houseArea?: number;
  roomMeasurements: Record<string, any>;
  sitePhotos?: string[];
  customerPreferences?: string;
  notes?: string;
}

export interface ReviewMeasurementParams {
  measurementId: string;
  reviewerId: string;
  reviewerRole: UserRole;
  approved: boolean;
  rejectedReason?: string;
}

export class MeasurementService {
  async createMeasurement(params: CreateMeasurementParams): Promise<any> {
    const { demandId, designerId, scheduledDate } = params;

    try {
      const demand = await prisma.demand.findUnique({
        where: { id: demandId }
      });

      if (!demand) {
        throw new Error('需求不存在');
      }

      if (demand.designerId !== designerId) {
        throw new Error('设计师无权限操作此需求');
      }

      const existingMeasurement = await prisma.measurement.findUnique({
        where: { demandId }
      });

      if (existingMeasurement) {
        throw new Error('该需求已存在量尺记录');
      }

      const measurement = await prisma.measurement.create({
        data: {
          demandId,
          designerId,
          status: 'PENDING' as MeasurementStatus,
          scheduledDate,
          roomMeasurements: {},
          sitePhotos: []
        }
      });

      await prisma.demand.update({
        where: { id: demandId },
        data: { status: 'MEASURING' as any }
      });

      await auditService.createLog({
        entityType: 'Measurement',
        entityId: measurement.id,
        action: 'MEASUREMENT_SCHEDULED',
        actorId: designerId,
        actorRole: 'DESIGNER',
        newState: {
          id: measurement.id,
          demandId,
          status: measurement.status,
          scheduledDate
        },
        reason: '安排上门量尺'
      });

      logger.info(`[MeasurementService] 量尺安排成功: demandId=${demandId}`);

      return measurement;
    } catch (error: any) {
      await exceptionService.createException({
        orderId: demandId,
        entityType: 'Measurement',
        exceptionType: 'BUSINESS_ERROR',
        message: `安排量尺失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async startMeasurement(measurementId: string, designerId: string): Promise<any> {
    try {
      const measurement = await prisma.measurement.findUnique({
        where: { id: measurementId }
      });

      if (!measurement) {
        throw new Error('量尺记录不存在');
      }

      if (measurement.designerId !== designerId) {
        throw new Error('设计师无权限操作此量尺');
      }

      if (measurement.status !== 'PENDING') {
        throw new Error(`量尺状态不正确，当前状态: ${measurement.status}`);
      }

      const previousState = { status: measurement.status };

      const updatedMeasurement = await prisma.measurement.update({
        where: { id: measurementId },
        data: { status: 'IN_PROGRESS' as MeasurementStatus }
      });

      await auditService.createLog({
        entityType: 'Measurement',
        entityId: measurementId,
        action: 'MEASUREMENT_STARTED',
        actorId: designerId,
        actorRole: 'DESIGNER',
        previousState,
        newState: { status: updatedMeasurement.status },
        reason: '开始上门量尺'
      });

      logger.info(`[MeasurementService] 量尺开始: measurementId=${measurementId}`);

      return updatedMeasurement;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Measurement',
        entityId: measurementId,
        exceptionType: 'BUSINESS_ERROR',
        message: `开始量尺失败: ${error.message}`,
        context: { measurementId, designerId },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async completeMeasurement(params: CompleteMeasurementParams): Promise<any> {
    const { measurementId, designerId, houseArea, roomMeasurements, sitePhotos, customerPreferences, notes } = params;

    try {
      const measurement = await prisma.measurement.findUnique({
        where: { id: measurementId }
      });

      if (!measurement) {
        throw new Error('量尺记录不存在');
      }

      if (measurement.designerId !== designerId) {
        throw new Error('设计师无权限操作此量尺');
      }

      if (measurement.status !== 'IN_PROGRESS' && measurement.status !== 'PENDING') {
        throw new Error(`量尺状态不正确，当前状态: ${measurement.status}`);
      }

      const previousState = {
        status: measurement.status,
        houseArea: measurement.houseArea,
        roomMeasurements: measurement.roomMeasurements,
        sitePhotos: measurement.sitePhotos
      };

      const updatedMeasurement = await prisma.measurement.update({
        where: { id: measurementId },
        data: {
          status: 'COMPLETED' as MeasurementStatus,
          measuredAt: new Date(),
          houseArea,
          roomMeasurements,
          sitePhotos: sitePhotos || [],
          customerPreferences,
          notes
        }
      });

      await prisma.demand.update({
        where: { id: measurement.demandId },
        data: { status: 'MEASURED' as any }
      });

      await auditService.createLog({
        entityType: 'Measurement',
        entityId: measurementId,
        action: 'MEASUREMENT_COMPLETED',
        actorId: designerId,
        actorRole: 'DESIGNER',
        previousState,
        newState: {
          status: updatedMeasurement.status,
          measuredAt: updatedMeasurement.measuredAt,
          houseArea: updatedMeasurement.houseArea
        },
        reason: '完成量尺数据上传'
      });

      logger.info(`[MeasurementService] 量尺完成: measurementId=${measurementId}`);

      return updatedMeasurement;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Measurement',
        entityId: measurementId,
        exceptionType: 'BUSINESS_ERROR',
        message: `完成量尺失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async reviewMeasurement(params: ReviewMeasurementParams): Promise<any> {
    const { measurementId, reviewerId, reviewerRole, approved, rejectedReason } = params;

    try {
      const measurement = await prisma.measurement.findUnique({
        where: { id: measurementId }
      });

      if (!measurement) {
        throw new Error('量尺记录不存在');
      }

      if (measurement.status !== 'COMPLETED') {
        throw new Error(`量尺状态不正确，当前状态: ${measurement.status}`);
      }

      const previousState = {
        status: measurement.status,
        reviewedBy: measurement.reviewedBy,
        reviewedAt: measurement.reviewedAt
      };

      const updatedMeasurement = await prisma.measurement.update({
        where: { id: measurementId },
        data: {
          status: approved ? 'APPROVED' as MeasurementStatus : 'REJECTED' as MeasurementStatus,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          rejectedReason: !approved ? rejectedReason : null
        }
      });

      if (approved) {
        await prisma.demand.update({
          where: { id: measurement.demandId },
          data: { status: 'DESIGNING' as any }
        });
      }

      await auditService.createLog({
        entityType: 'Measurement',
        entityId: measurementId,
        action: approved ? 'MEASUREMENT_APPROVED' : 'MEASUREMENT_REJECTED',
        actorId: reviewerId,
        actorRole: reviewerRole,
        previousState,
        newState: {
          status: updatedMeasurement.status,
          reviewedBy: updatedMeasurement.reviewedBy,
          reviewedAt: updatedMeasurement.reviewedAt
        },
        reason: approved ? '量尺审核通过' : '量尺审核拒绝',
        metadata: { rejectedReason }
      });

      logger.info(`[MeasurementService] 量尺审核完成: measurementId=${measurementId}, approved=${approved}`);

      return updatedMeasurement;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Measurement',
        entityId: measurementId,
        exceptionType: 'BUSINESS_ERROR',
        message: `审核量尺失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async getMeasurementById(measurementId: string): Promise<any> {
    return prisma.measurement.findUnique({
      where: { id: measurementId },
      include: {
        demand: {
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

  async getMeasurementsByDesigner(designerId: string, status?: MeasurementStatus): Promise<any[]> {
    const where: any = { designerId };
    if (status) {
      where.status = status;
    }

    return prisma.measurement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        demand: {
          select: { id: true, demandNumber: true, address: true }
        }
      }
    });
  }
}

export const measurementService = new MeasurementService();
export default MeasurementService;
