import { Router, type Request, type Response } from 'express';
import * as claimService from '../services/claimService.js';
import type { ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const orderId = req.query.orderId as string;
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | undefined;
    const type = req.query.type as 'timeout' | 'damaged' | 'rejected' | undefined;

    const result = await claimService.getClaims({ page, pageSize, orderId, status, type });

    const response: ApiResponse = {
      success: true,
      data: result,
      message: '获取赔付列表成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取赔付列表失败',
    };
    res.status(500).json(response);
  }
});

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await claimService.getClaimStats();

    const response: ApiResponse = {
      success: true,
      data: stats,
      message: '获取赔付统计成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取赔付统计失败',
    };
    res.status(500).json(response);
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const claim = await claimService.getClaimById(id);

    if (!claim) {
      const response: ApiResponse = {
        success: false,
        message: '赔付记录不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: claim,
      message: '获取赔付详情成功',
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取赔付详情失败',
    };
    res.status(500).json(response);
  }
});

router.post('/auto', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, type, reason, evidence, damageRatio } = req.body;
    const result = await claimService.createAutoClaim(orderId, type, { reason, evidence, damageRatio });

    const response: ApiResponse = {
      success: !!result.claim,
      data: result,
      message: result.message,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '自动赔付申请失败',
    };
    res.status(500).json(response);
  }
});

router.post('/manual', async (req: Request, res: Response): Promise<void> => {
  try {
    const claim = await claimService.createManualClaim(req.body);
    const response: ApiResponse = {
      success: true,
      data: claim,
      message: '提交赔付申请成功',
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '提交赔付申请失败',
    };
    res.status(500).json(response);
  }
});

router.put('/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { action } = req.body;
    const claim = await claimService.reviewClaim(id, action);

    if (!claim) {
      const response: ApiResponse = {
        success: false,
        message: '赔付记录不存在',
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: claim,
      message: `赔付${action === 'approve' ? '通过' : '拒绝'}成功`,
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '审核赔付失败',
    };
    res.status(500).json(response);
  }
});

export default router;
