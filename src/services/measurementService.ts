import { databaseService } from './databaseService';
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
      const demand = await databaseService.findUnique('demand', { id: demandId });

      if (!demand) {
        throw new Error('需求不存在');
      }

      logger.info(`[MeasurementService] 检查需求设计师: demandId=${demandId}, demand.designerId=${demand.designerId}, designerId=${designerId}`);

      if (demand.designerId !== designerId) {
        throw new Error('设计师无权限操作此需求');
      }

      const existingMeasurement = (await databaseService.findMany('measurement')).find((m: any) => m.demandId === demandId);

      if (existingMeasurement) {
        throw new Error('该需求已存在量尺记录');
      }

      const measurement = await databaseService.create('measurement', {
        demandId,
        designerId,
        status: 'PENDING' as MeasurementStatus,
        scheduledDate,
        roomMeasurements: {},
        sitePhotos: []
      });

      await databaseService.update('demand', { id: demandId }, { status: 'MEASURING' as any });

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
      const measurement = await databaseService.findUnique('measurement', { id: measurementId });

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

      const updatedMeasurement = await databaseService.update('measurement', { id: measurementId }, {
        status: 'IN_PROGRESS' as MeasurementStatus
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
      const measurement = await databaseService.findUnique('measurement', { id: measurementId });

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

      const updatedMeasurement = await databaseService.update('measurement', { id: measurementId }, {
        status: 'COMPLETED' as MeasurementStatus,
        measuredAt: new Date(),
        houseArea,
        roomMeasurements,
        sitePhotos: sitePhotos || [],
        customerPreferences,
        notes
      });

      await databaseService.update('demand', { id: measurement.demandId }, { status: 'MEASURED' as any });

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
      const measurement = await databaseService.findUnique('measurement', { id: measurementId });

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

      const updatedMeasurement = await databaseService.update('measurement', { id: measurementId }, {
        status: approved ? 'APPROVED' as MeasurementStatus : 'REJECTED' as MeasurementStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectedReason: !approved ? rejectedReason : null
      });

      if (approved) {
        await databaseService.update('demand', { id: measurement.demandId }, { status: 'DESIGNING' as any });
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
    const measurement = await databaseService.findUnique('measurement', { id: measurementId });
    if (!measurement) return null;
    
    // 模拟关联数据
    const demand = await databaseService.findUnique('demand', { id: measurement.demandId });
    const customer = demand ? await databaseService.findUnique('user', { id: demand.customerId }) : null;
    const designer = await databaseService.findUnique('user', { id: measurement.designerId });
    
    return {
      ...measurement,
      demand: demand ? {
        ...demand,
        customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null
      } : null,
      designer: designer ? { id: designer.id, name: designer.name, phone: designer.phone } : null
    };
  }

  async getMeasurementsByDesigner(designerId: string, status?: MeasurementStatus): Promise<any[]> {
    const measurements = await databaseService.findMany('measurement');
    let designerMeasurements = measurements.filter((m: any) => m.designerId === designerId);
    
    if (status) {
      designerMeasurements = designerMeasurements.filter((m: any) => m.status === status);
    }
    
    // 按创建时间倒序排序
    designerMeasurements.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // 模拟关联数据
    return Promise.all(designerMeasurements.map(async (measurement: any) => {
      const demand = await databaseService.findUnique('demand', { id: measurement.demandId });
      return {
        ...measurement,
        demand: demand ? { id: demand.id, demandNumber: demand.demandNumber, address: demand.address } : null
      };
    }));
  }
}

export const measurementService = new MeasurementService();
export default MeasurementService;
