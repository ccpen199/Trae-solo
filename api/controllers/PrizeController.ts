import { Request, Response } from 'express';
import { PrizeService } from '../services/PrizeService.js';
import type { Prize, Winner, ApiResponse, AuthRequest, ShippingInfo } from '../../shared/types.js';

export class PrizeController {
  private prizeService: PrizeService;

  constructor() {
    this.prizeService = new PrizeService();
  }

  getPrizeList(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const type = req.query.type as Prize['type'] | undefined;

      const result = this.prizeService.getPrizeList(page, pageSize, type);
      
      res.json({
        code: 200,
        message: 'success',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取奖品列表失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getPrizeDetail(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const prize = this.prizeService.getPrizeDetail(id);
      
      if (!prize) {
        return res.status(404).json({
          code: 404,
          message: '奖品不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: 'success',
        data: prize,
        timestamp: Date.now()
      } as ApiResponse<typeof prize>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取奖品详情失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  createPrize(req: AuthRequest, res: Response) {
    try {
      const validation = this.prizeService.validatePrize(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          code: 400,
          message: validation.errors.join('; '),
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const id = this.prizeService.createPrize(req.body);
      
      res.json({
        code: 200,
        message: '创建成功',
        data: { id },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '创建奖品失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  updatePrize(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = this.prizeService.updatePrize(id, req.body);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '奖品不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '更新成功',
        data: { id },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '更新奖品失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  deletePrize(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = this.prizeService.deletePrize(id);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '奖品不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '删除成功',
        data: { id },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '删除奖品失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getAllPrizes(req: AuthRequest, res: Response) {
    try {
      const prizes = this.prizeService.getAllPrizes();
      
      res.json({
        code: 200,
        message: 'success',
        data: prizes,
        timestamp: Date.now()
      } as ApiResponse<typeof prizes>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取奖品列表失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getWinnerList(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const status = req.query.status as Winner['status'] | undefined;

      const result = this.prizeService.getWinnerList(page, pageSize, status);
      
      res.json({
        code: 200,
        message: 'success',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取中奖列表失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  distributePrize(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = this.prizeService.distributePrize(id);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '中奖记录不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '发放成功',
        data: { id },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '发放失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  shipPrize(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const shippingInfo = req.body as ShippingInfo;
      
      if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
        return res.status(400).json({
          code: 400,
          message: '收货人信息不完整',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const success = this.prizeService.shipPrize(id, shippingInfo);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '中奖记录不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '物流信息录入成功',
        data: { id },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '录入物流信息失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  redeemPrize(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = this.prizeService.redeemPrize(id);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '中奖记录不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '核销成功',
        data: { id },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '核销失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  reissuePrize(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const newId = this.prizeService.reissuePrize(id);
      
      if (newId === 0) {
        return res.status(404).json({
          code: 404,
          message: '原中奖记录不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '补发成功',
        data: { id: newId },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '补发失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getUserWinners(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({
          code: 400,
          message: '用户ID不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = this.prizeService.getUserWinners(userId, page, pageSize);
      
      res.json({
        code: 200,
        message: 'success',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取用户奖品失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }
}
