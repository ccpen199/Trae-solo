import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  addFollowUpRecord
} from '../services/appointment.service.js';
import type { Appointment, AppointmentStatus } from '../types/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('appointment', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { buyerId, salesId, status, carId } = req.query;

      const filters: {
        buyerId?: number;
        salesId?: number;
        status?: string;
        carId?: number;
      } = {};

      if (req.user?.role === 'buyer') {
        filters.buyerId = req.user.userId;
      } else if (buyerId !== undefined) {
        filters.buyerId = parseInt(buyerId as string, 10);
      }

      if (req.user?.role === 'sales') {
        filters.salesId = req.user.userId;
      } else if (salesId !== undefined) {
        filters.salesId = parseInt(salesId as string, 10);
      }

      if (status !== undefined) {
        filters.status = status as string;
      }

      if (carId !== undefined) {
        filters.carId = parseInt(carId as string, 10);
      }

      const appointments = await getAppointments(filters);
      res.status(200).json(successResponse(appointments, '获取预约列表成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取预约列表失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('appointment', 'create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body as Partial<Appointment> & { carId: number; buyerId: number };

      if (req.user?.role === 'buyer') {
        data.buyerId = req.user.userId;
      }

      if (!data.carId || !data.buyerId) {
        res.status(400).json(errorResponse('车源ID和买家ID不能为空', 400));
        return;
      }

      if (!data.appointmentTime) {
        res.status(400).json(errorResponse('预约时间不能为空', 400));
        return;
      }

      if (!data.contactPhone) {
        res.status(400).json(errorResponse('联系电话不能为空', 400));
        return;
      }

      const appointment = await createAppointment(data);
      res.status(201).json(successResponse(appointment, '创建预约成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建预约失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('appointment', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的预约ID', 400));
        return;
      }

      const appointment = await getAppointmentById(id);
      if (!appointment) {
        res.status(404).json(errorResponse('预约不存在', 404));
        return;
      }

      if (req.user?.role === 'buyer' && appointment.buyerId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限查看此预约', 403));
        return;
      }

      if (req.user?.role === 'sales' && appointment.salesId && appointment.salesId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限查看此预约', 403));
        return;
      }

      res.status(200).json(successResponse(appointment, '获取预约详情成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取预约详情失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/status',
  authenticate,
  requirePermission('appointment', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的预约ID', 400));
        return;
      }

      const { status, notes } = req.body as { status: AppointmentStatus; notes?: string };

      if (!status) {
        res.status(400).json(errorResponse('状态不能为空', 400));
        return;
      }

      const existing = await getAppointmentById(id);
      if (!existing) {
        res.status(404).json(errorResponse('预约不存在', 404));
        return;
      }

      if (req.user?.role === 'sales' && existing.salesId && existing.salesId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限修改此预约', 403));
        return;
      }

      const operatorId = req.user!.userId;
      const updated = await updateAppointmentStatus(id, status, operatorId, notes);
      res.status(200).json(successResponse(updated, '更新预约状态成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新预约状态失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/:id/followup',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['sales', 'admin', 'customer_service'].includes(req.user.role)) {
        res.status(403).json(errorResponse('无权限添加跟进记录', 403));
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的预约ID', 400));
        return;
      }

      const { content } = req.body as { content: string };

      if (!content || content.trim().length === 0) {
        res.status(400).json(errorResponse('跟进内容不能为空', 400));
        return;
      }

      const operatorId = req.user.userId;
      const record = await addFollowUpRecord(id, operatorId, content);
      res.status(201).json(successResponse(record, '添加跟进记录成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '添加跟进记录失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
