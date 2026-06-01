import { Response } from 'express';
import { RiskService } from '../services/RiskService.js';
import type { RiskItem, ApiResponse, AuthRequest, RiskProcessRequest } from '../../shared/types.js';

export class RiskController {
  private riskService: RiskService;

  constructor() {
    this.riskService = new RiskService();
  }

  getQueue(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const status = req.query.status as RiskItem['status'] | undefined;

      const result = this.riskService.getRiskQueue(page, pageSize, status);
      
      res.json({
        code: 200,
        message: 'success',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取风控队列失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getDetail(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const riskItem = this.riskService.getRiskDetail(id);
      
      if (!riskItem) {
        return res.status(404).json({
          code: 404,
          message: '风控项不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: 'success',
        data: riskItem,
        timestamp: Date.now()
      } as ApiResponse<typeof riskItem>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取风控详情失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getEvidence(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const evidence = this.riskService.getRiskEvidence(id);
      
      if (!evidence) {
        return res.status(404).json({
          code: 404,
          message: '风控项不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: 'success',
        data: evidence,
        timestamp: Date.now()
      } as ApiResponse<typeof evidence>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取风控证据失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  process(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const request = req.body as RiskProcessRequest;
      const adminId = req.admin?.id;

      if (!adminId) {
        return res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      if (!request.action || !request.note) {
        return res.status(400).json({
          code: 400,
          message: '处理动作和备注不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const success = this.riskService.processRiskItem(id, request, adminId);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '风控项不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '处理成功',
        data: { id },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '处理失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getPendingCount(req: AuthRequest, res: Response) {
    try {
      const count = this.riskService.getPendingCount();
      
      res.json({
        code: 200,
        message: 'success',
        data: { count },
        timestamp: Date.now()
      } as ApiResponse<{ count: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取待处理数量失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  manualReissue(req: AuthRequest, res: Response) {
    try {
      const { lotteryRecordId, note } = req.body as { lotteryRecordId: number; note: string };
      const adminId = req.admin?.id;

      if (!adminId) {
        return res.status(401).json({
          code: 401,
          message: '未登录',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      if (!lotteryRecordId || !note) {
        return res.status(400).json({
          code: 400,
          message: '抽奖记录ID和备注不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const winnerId = this.riskService.manualReissue(lotteryRecordId, adminId, note);
      
      if (winnerId === 0) {
        return res.status(404).json({
          code: 404,
          message: '抽奖记录不存在或未中奖',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '人工补发成功',
        data: { winnerId },
        timestamp: Date.now()
      } as ApiResponse<{ winnerId: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '人工补发失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }
}
