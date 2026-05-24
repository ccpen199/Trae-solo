import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getDeposits,
  getDepositById,
  createDeposit,
  payDeposit,
  requestRefund,
  approveRefund,
  releaseDeposit
} from '../services/deposit.service.js';
import type { Deposit } from '../types/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('deposit', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { buyerId, carId, status } = req.query;

      const filters: {
        buyerId?: number;
        carId?: number;
        status?: string;
      } = {};

      if (req.user?.role === 'buyer') {
        filters.buyerId = req.user.userId;
      } else if (buyerId !== undefined) {
        filters.buyerId = parseInt(buyerId as string, 10);
      }

      if (carId !== undefined) {
        filters.carId = parseInt(carId as string, 10);
      }

      if (status !== undefined) {
        filters.status = status as string;
      }

      const deposits = await getDeposits(filters);
      res.status(200).json(successResponse(deposits, '获取订金列表成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取订金列表失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('deposit', 'create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'buyer') {
        res.status(403).json(errorResponse('只有买家可以创建订金订单', 403));
        return;
      }

      const data = req.body as Partial<Deposit> & { carId: number; buyerId: number };
      data.buyerId = req.user.userId;

      if (!data.carId) {
        res.status(400).json(errorResponse('车源ID不能为空', 400));
        return;
      }

      const deposit = await createDeposit(data);
      res.status(201).json(successResponse(deposit, '创建订金订单成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建订金订单失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('deposit', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的订金ID', 400));
        return;
      }

      const deposit = await getDepositById(id);
      if (!deposit) {
        res.status(404).json(errorResponse('订金记录不存在', 404));
        return;
      }

      if (req.user?.role === 'buyer' && deposit.buyerId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限查看此订金记录', 403));
        return;
      }

      res.status(200).json(successResponse(deposit, '获取订金详情成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取订金详情失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/pay',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'buyer') {
        res.status(403).json(errorResponse('只有买家可以确认支付', 403));
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的订金ID', 400));
        return;
      }

      const { paymentMethod, transactionId } = req.body as {
        paymentMethod: string;
        transactionId: string;
      };

      if (!paymentMethod) {
        res.status(400).json(errorResponse('支付方式不能为空', 400));
        return;
      }

      if (!transactionId) {
        res.status(400).json(errorResponse('交易号不能为空', 400));
        return;
      }

      const existing = await getDepositById(id);
      if (!existing) {
        res.status(404).json(errorResponse('订金记录不存在', 404));
        return;
      }

      if (existing.buyerId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限支付此订金', 403));
        return;
      }

      const updated = await payDeposit(id, paymentMethod, transactionId);
      res.status(200).json(successResponse(updated, '确认支付成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '确认支付失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/refund-request',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !['buyer', 'sales', 'admin'].includes(req.user.role)) {
        res.status(403).json(errorResponse('无权限申请退款', 403));
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的订金ID', 400));
        return;
      }

      const { reason } = req.body as { reason: string };

      if (!reason || reason.trim().length === 0) {
        res.status(400).json(errorResponse('退款原因不能为空', 400));
        return;
      }

      const existing = await getDepositById(id);
      if (!existing) {
        res.status(404).json(errorResponse('订金记录不存在', 404));
        return;
      }

      if (req.user.role === 'buyer' && existing.buyerId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限申请此订金的退款', 403));
        return;
      }

      const operatorId = req.user.userId;
      const updated = await requestRefund(id, reason, operatorId);
      res.status(200).json(successResponse(updated, '申请退款成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '申请退款失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/refund',
  authenticate,
  requirePermission('deposit', 'refund'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的订金ID', 400));
        return;
      }

      const { approved } = req.body as { approved: boolean };

      if (approved === undefined) {
        res.status(400).json(errorResponse('审核结果不能为空', 400));
        return;
      }

      const existing = await getDepositById(id);
      if (!existing) {
        res.status(404).json(errorResponse('订金记录不存在', 404));
        return;
      }

      const operatorId = req.user!.userId;
      const updated = await approveRefund(id, approved, operatorId);
      res.status(200).json(successResponse(updated, approved ? '退款审核通过' : '退款审核拒绝'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '审核退款失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/release',
  authenticate,
  requirePermission('deposit', 'release'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的订金ID', 400));
        return;
      }

      const { releaseType } = req.body as { releaseType: 'to_seller' | 'deducted' };

      if (!releaseType || !['to_seller', 'deducted'].includes(releaseType)) {
        res.status(400).json(errorResponse('释放类型不能为空且必须是 to_seller 或 deducted', 400));
        return;
      }

      const existing = await getDepositById(id);
      if (!existing) {
        res.status(404).json(errorResponse('订金记录不存在', 404));
        return;
      }

      const operatorId = req.user!.userId;
      const updated = await releaseDeposit(id, releaseType, operatorId);
      res.status(200).json(successResponse(updated, releaseType === 'to_seller' ? '订金已释放给卖家' : '订金已作为违约金扣除'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '释放订金失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
