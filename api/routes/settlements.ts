import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getSettlements,
  getSettlementById,
  createSettlement,
  markSettled,
  markReconciled,
  markInvoiced
} from '../services/settlement.service.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('settlement', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { dealerId, status } = req.query;

      const filters: { dealerId?: number; status?: string } = {};

      if (req.user?.role === 'dealer') {
        filters.dealerId = req.user.userId;
      } else if (dealerId !== undefined) {
        filters.dealerId = parseInt(dealerId as string, 10);
      }

      if (status !== undefined) {
        filters.status = status as string;
      }

      const settlements = await getSettlements(filters);
      res.status(200).json(successResponse(settlements, '获取结算列表成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取结算列表失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('settlement', 'create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.body as { contractId: number };

      if (!contractId) {
        res.status(400).json(errorResponse('合同ID不能为空', 400));
        return;
      }

      const operatorId = req.user!.userId;
      const settlement = await createSettlement(contractId, operatorId);
      res.status(201).json(successResponse(settlement, '创建结算单成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建结算单失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('settlement', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的结算ID', 400));
        return;
      }

      const settlement = await getSettlementById(id);
      if (!settlement) {
        res.status(404).json(errorResponse('结算单不存在', 404));
        return;
      }

      if (req.user?.role === 'dealer' && settlement.dealerId !== req.user.userId) {
        res.status(403).json(errorResponse('无权限查看此结算单', 403));
        return;
      }

      res.status(200).json(successResponse(settlement, '获取结算详情成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取结算详情失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/settle',
  authenticate,
  requirePermission('settlement', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的结算ID', 400));
        return;
      }

      const operatorId = req.user!.userId;
      const settlement = await markSettled(id, operatorId);
      res.status(200).json(successResponse(settlement, '标记已结算成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '标记已结算失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/reconcile',
  authenticate,
  requirePermission('settlement', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的结算ID', 400));
        return;
      }

      const operatorId = req.user!.userId;
      const settlement = await markReconciled(id, operatorId);
      res.status(200).json(successResponse(settlement, '标记已对账成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '标记已对账失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/invoice',
  authenticate,
  requirePermission('settlement', 'update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的结算ID', 400));
        return;
      }

      const { invoiceNumber } = req.body as { invoiceNumber: string };

      if (!invoiceNumber || invoiceNumber.trim().length === 0) {
        res.status(400).json(errorResponse('发票号不能为空', 400));
        return;
      }

      const operatorId = req.user!.userId;
      const settlement = await markInvoiced(id, invoiceNumber, operatorId);
      res.status(200).json(successResponse(settlement, '标记已开票成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '标记已开票失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
