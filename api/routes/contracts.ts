import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permission.js';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getContracts,
  getContractById,
  createContract,
  sendForSign,
  signContract,
  confirmPayment,
  completeContract
} from '../services/contract.service.js';
import type { Contract } from '../types/index.js';

const router = Router();

router.get(
  '/',
  authenticate,
  requirePermission('contract', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { buyerId, dealerId, status } = req.query;

      const filters: { buyerId?: number; dealerId?: number; status?: string } = {};

      if (req.user?.role === 'buyer') {
        filters.buyerId = req.user.userId;
      } else if (req.user?.role === 'dealer') {
        filters.dealerId = req.user.userId;
      } else {
        if (buyerId !== undefined) {
          filters.buyerId = parseInt(buyerId as string, 10);
        }
        if (dealerId !== undefined) {
          filters.dealerId = parseInt(dealerId as string, 10);
        }
      }

      if (status !== undefined) {
        filters.status = status as string;
      }

      const contracts = await getContracts(filters);
      res.status(200).json(successResponse(contracts, '获取合同列表成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取合同列表失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('contract', 'create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'sales' && req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有销售或管理员可以创建合同', 403));
        return;
      }

      const data = req.body as Partial<Contract> & {
        carId: number;
        buyerId: number;
        dealerId: number;
        depositId?: number;
      };

      const contract = await createContract(data);
      res.status(201).json(successResponse(contract, '创建合同成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建合同失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('contract', 'read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的合同ID', 400));
        return;
      }

      const contract = await getContractById(id);
      if (!contract) {
        res.status(404).json(errorResponse('合同不存在', 404));
        return;
      }

      if (
        req.user?.role === 'buyer' && contract.buyerId !== req.user.userId ||
        req.user?.role === 'dealer' && contract.dealerId !== req.user.userId
      ) {
        res.status(403).json(errorResponse('无权限查看此合同', 403));
        return;
      }

      res.status(200).json(successResponse(contract, '获取合同详情成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取合同详情失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/sign',
  authenticate,
  requirePermission('contract', 'sign'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的合同ID', 400));
        return;
      }

      const { signerRole } = req.body as { signerRole: 'buyer' | 'dealer' };

      if (!signerRole || !['buyer', 'dealer'].includes(signerRole)) {
        res.status(400).json(errorResponse('无效的签署方角色', 400));
        return;
      }

      if (
        req.user?.role === 'buyer' && signerRole !== 'buyer' ||
        req.user?.role === 'dealer' && signerRole !== 'dealer'
      ) {
        res.status(403).json(errorResponse('无权限签署此合同', 403));
        return;
      }

      const operatorId = req.user!.userId;
      const contract = await signContract(id, signerRole, operatorId);
      res.status(200).json(successResponse(contract, '签署合同成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '签署合同失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/confirm-payment',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'sales' && req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有销售或管理员可以确认尾款支付', 403));
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的合同ID', 400));
        return;
      }

      const operatorId = req.user.userId;
      const contract = await confirmPayment(id, operatorId);
      res.status(200).json(successResponse(contract, '确认尾款支付成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '确认尾款支付失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

router.put(
  '/:id/complete',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'admin') {
        res.status(403).json(errorResponse('只有管理员可以完成合同', 403));
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json(errorResponse('无效的合同ID', 400));
        return;
      }

      const operatorId = req.user.userId;
      const contract = await completeContract(id, operatorId);
      res.status(200).json(successResponse(contract, '完成合同成功'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '完成合同失败';
      res.status(400).json(errorResponse(message, 400));
    }
  }
);

export default router;
