import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getTransfers,
  getTransferById,
  createTransfer,
  submitTransfer,
  reviewTransfer,
  completeTransfer
} from '../services/transfer.service.js';
import type { Transfer, TransferDocument } from '../types/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('transfer', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { carId, status } = req.query;

      const filters: { carId?: number; status?: string } = {};

      if (carId !== undefined) {
        filters.carId = parseInt(carId as string, 10);
      }

      if (status !== undefined) {
        filters.status = status as string;
      }

      const transfers = await getTransfers(filters);
      res.status(200).json(successResponse(transfers, '获取过户列表成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取过户列表失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('transfer', 'create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body as Partial<Transfer> & { contractId: number; carId: number };

      if (!data.contractId || !data.carId) {
        res.status(400).json(errorResponse('合同ID和车源ID不能为空', 400));
        return;
      }

      const transfer = await createTransfer(data);
      res.status(201).json(successResponse(transfer, '创建过户申请成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建过户申请失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('transfer', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的过户ID', 400));
        return;
      }

      const transfer = await getTransferById(id);
      if (!transfer) {
        res.status(404).json(errorResponse('过户申请不存在', 404));
        return;
      }

      res.status(200).json(successResponse(transfer, '获取过户详情成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取过户详情失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/submit',
  authenticate,
  requirePermission('transfer', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的过户ID', 400));
        return;
      }

      const { documents } = req.body as { documents: TransferDocument[] };

      if (!documents || documents.length === 0) {
        res.status(400).json(errorResponse('请上传过户资料', 400));
        return;
      }

      const operatorId = req.user!.userId;
      const transfer = await submitTransfer(id, documents, operatorId);
      res.status(200).json(successResponse(transfer, '提交过户资料成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交过户资料失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/review',
  authenticate,
  requirePermission('transfer', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的过户ID', 400));
        return;
      }

      const { approved, comment } = req.body as { approved: boolean; comment: string };

      if (approved === undefined) {
        res.status(400).json(errorResponse('审核结果不能为空', 400));
        return;
      }

      const reviewerId = req.user!.userId;
      const transfer = await reviewTransfer(id, approved, comment || '', reviewerId);
      res.status(200).json(successResponse(transfer, approved ? '过户审核通过' : '过户审核拒绝'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '审核过户资料失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/complete',
  authenticate,
  requirePermission('transfer', 'complete'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的过户ID', 400));
        return;
      }

      const operatorId = req.user!.userId;
      const transfer = await completeTransfer(id, operatorId);
      res.status(200).json(successResponse(transfer, '确认过户完成成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '确认过户完成失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
