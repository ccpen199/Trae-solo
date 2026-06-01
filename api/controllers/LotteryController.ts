import { Response, Request } from 'express';
import { LotteryService } from '../services/LotteryService.js';
import type { DrawRequest, ApiResponse, AuthRequest } from '../../shared/types.js';

export class LotteryController {
  private lotteryService: LotteryService;

  constructor() {
    this.lotteryService = new LotteryService();
  }

  checkQualification(req: Request, res: Response) {
    try {
      const { activityId, userId } = req.body as { activityId: number; userId: string };
      
      if (!activityId || !userId) {
        return res.status(400).json({
          code: 400,
          message: '活动ID和用户ID不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const result = this.lotteryService.checkQualification(activityId, userId);
      
      res.json({
        code: 200,
        message: 'success',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '资格校验失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  draw(req: Request, res: Response) {
    try {
      const drawRequest = req.body as DrawRequest;
      
      if (!drawRequest.activityId || !drawRequest.userId) {
        return res.status(400).json({
          code: 400,
          message: '活动ID和用户ID不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const ip = req.ip || req.socket.remoteAddress || undefined;
      const userAgent = req.headers['user-agent'];

      const result = this.lotteryService.executeDraw(drawRequest, ip, userAgent);
      
      res.json({
        code: 200,
        message: result.isWin ? '恭喜中奖！' : '谢谢参与',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      console.error('draw error:', error);
      res.status(400).json({
        code: 400,
        message: error instanceof Error ? error.message : '抽奖失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getRecords(req: AuthRequest, res: Response) {
    try {
      const activityId = parseInt(req.query.activityId as string);
      if (!activityId) {
        return res.status(400).json({
          code: 400,
          message: '活动ID不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const result = this.lotteryService.getLotteryRecords(activityId, page, pageSize);
      
      res.json({
        code: 200,
        message: 'success',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取抽奖记录失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getUserRecords(req: Request, res: Response) {
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

      const result = this.lotteryService.getUserLotteryRecords(userId, page, pageSize);
      
      res.json({
        code: 200,
        message: 'success',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      console.error('getUserRecords error:', error);
      res.status(500).json({
        code: 500,
        message: '获取用户抽奖记录失败: ' + (error as Error).message,
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  completeTask(req: Request, res: Response) {
    try {
      const { activityId, userId, taskId, channel, deviceId } = req.body as { 
        activityId: number; userId: string; taskId: string; channel?: string; deviceId?: string 
      };
      
      if (!activityId || !userId || !taskId) {
        return res.status(400).json({
          code: 400,
          message: '活动ID、用户ID和任务ID不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const success = this.lotteryService.completeTask(activityId, userId, taskId, channel, deviceId);
      
      res.json({
        code: 200,
        message: success ? '任务完成' : '任务已完成',
        data: { success },
        timestamp: Date.now()
      } as ApiResponse<{ success: boolean }>);
    } catch (error) {
      console.error('completeTask error:', error);
      res.status(500).json({
        code: 500,
        message: '任务完成失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getUserParticipation(req: Request, res: Response) {
    try {
      const activityId = parseInt(req.query.activityId as string);
      const userId = req.query.userId as string;
      
      if (!activityId || !userId) {
        return res.status(400).json({
          code: 400,
          message: '活动ID和用户ID不能为空',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const participation = this.lotteryService.getUserParticipation(activityId, userId);
      
      res.json({
        code: 200,
        message: 'success',
        data: participation,
        timestamp: Date.now()
      } as ApiResponse<typeof participation>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取参与信息失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }
}
