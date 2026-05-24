import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getExceptions,
  getExceptionById,
  createException,
  assignException,
  addHandlingRecord,
  resolveException,
  closeException
} from '../services/exception.service.js';
import type { Exception, ExceptionType, ExceptionStatus } from '../types/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('exception', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, status, assigneeId } = req.query;

      const filters: {
        type?: ExceptionType;
        status?: ExceptionStatus;
        assigneeId?: number;
      } = {};

      if (req.user?.role === 'customer_service') {
        filters.assigneeId = req.user.userId;
      } else if (assigneeId !== undefined) {
        filters.assigneeId = parseInt(assigneeId as string, 10);
      }

      if (type !== undefined) {
        filters.type = type as ExceptionType;
      }

      if (status !== undefined) {
        filters.status = status as ExceptionStatus;
      }

      const exceptions = await getExceptions(filters);
      res.status(200).json(successResponse(exceptions, '获取异常工单列表成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取异常工单列表失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('exception', 'create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body as Partial<Exception> & {
        type: ExceptionType;
        relatedType: string;
        relatedId: number;
        reporterId: number;
      };

      data.reporterId = req.user!.userId;

      const exception = await createException(data);
      res.status(201).json(successResponse(exception, '创建异常工单成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建异常工单失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('exception', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的工单ID', 400));
        return;
      }

      const exception = await getExceptionById(id);
      if (!exception) {
        res.status(404).json(errorResponse('异常工单不存在', 404));
        return;
      }

      if (req.user?.role === 'customer_service' && exception.assigneeId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限查看此工单', 403));
        return;
      }

      res.status(200).json(successResponse(exception, '获取异常工单详情成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取异常工单详情失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/assign',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以分配工单', 403));
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的工单ID', 400));
        return;
      }

      const { assigneeId } = req.body as { assigneeId: number };
      if (!assigneeId) {
        res.status(400).json(errorResponse('请指定处理人', 400));
        return;
      }

      const operatorId = req.user.userId;
      const exception = await assignException(id, assigneeId, operatorId);
      res.status(200).json(successResponse(exception, '分配处理人成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '分配处理人失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/:id/record',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin' && req.user?.role !== 'customer_service') {
        res.status(403).json(errorResponse('无权限添加处理记录', 403));
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的工单ID', 400));
        return;
      }

      const exception = await getExceptionById(id);
      if (!exception) {
        res.status(404).json(errorResponse('异常工单不存在', 404));
        return;
      }

      if (req.user.role === 'customer_service' && exception.assigneeId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限处理此工单', 403));
        return;
      }

      const { action, comment } = req.body as { action: string; comment: string };
      if (!action || !comment) {
        res.status(400).json(errorResponse('操作和备注不能为空', 400));
        return;
      }

      const operatorId = req.user.userId;
      const record = await addHandlingRecord(id, operatorId, action, comment);
      res.status(200).json(successResponse(record, '添加处理记录成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '添加处理记录失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/resolve',
  authenticate,
  requirePermission('exception', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的工单ID', 400));
        return;
      }

      const exception = await getExceptionById(id);
      if (!exception) {
        res.status(404).json(errorResponse('异常工单不存在', 404));
        return;
      }

      if (req.user?.role === 'customer_service' && exception.assigneeId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限处理此工单', 403));
        return;
      }

      const { resolution } = req.body as { resolution: string };
      if (!resolution) {
        res.status(400).json(errorResponse('解决方案不能为空', 400));
        return;
      }

      const operatorId = req.user!.userId;
      const updatedException = await resolveException(id, resolution, operatorId);
      res.status(200).json(successResponse(updatedException, '解决异常成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '解决异常失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/close',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以关闭工单', 403));
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的工单ID', 400));
        return;
      }

      const operatorId = req.user.userId;
      const exception = await closeException(id, operatorId);
      res.status(200).json(successResponse(exception, '关闭工单成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '关闭工单失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
