import { Request, Response } from 'express';
import { ActivityService } from '../services/ActivityService.js';
import type { Activity, ApiResponse, AuthRequest } from '../../shared/types.js';

export class ActivityController {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  getList(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const status = req.query.status as Activity['status'] | undefined;

      const result = this.activityService.getActivityList(page, pageSize, status);
      
      res.json({
        code: 200,
        message: 'success',
        data: result,
        timestamp: Date.now()
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取活动列表失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getDetail(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const activity = this.activityService.getActivityDetail(id);
      
      if (!activity) {
        return res.status(404).json({
          code: 404,
          message: '活动不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: 'success',
        data: activity,
        timestamp: Date.now()
      } as ApiResponse<typeof activity>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取活动详情失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  create(req: AuthRequest, res: Response) {
    try {
      const validation = this.activityService.validateActivity(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          code: 400,
          message: validation.errors.join('; '),
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      const id = this.activityService.createActivity(req.body);
      
      res.json({
        code: 200,
        message: '创建成功',
        data: { id },
        timestamp: Date.now()
      } as ApiResponse<{ id: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '创建活动失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = this.activityService.updateActivity(id, req.body);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '活动不存在',
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
        message: '更新活动失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  updateStatus(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body as { status: Activity['status'] };
      
      const success = this.activityService.updateActivityStatus(id, status);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '活动不存在',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: '状态更新成功',
        data: { id, status },
        timestamp: Date.now()
      } as ApiResponse<{ id: number; status: Activity['status'] }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '更新状态失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = this.activityService.deleteActivity(id);
      
      if (!success) {
        return res.status(404).json({
          code: 404,
          message: '活动不存在',
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
        message: '删除活动失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getPublicList(req: Request, res: Response) {
    try {
      const result = this.activityService.getPublishedActivities();
      
      res.json({
        code: 200,
        message: 'success',
        data: {
          items: result,
          total: result.length
        },
        timestamp: Date.now()
      } as ApiResponse<{ items: Activity[]; total: number }>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取公开活动列表失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }

  getUserActivity(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const activity = this.activityService.getUserActivity(id);
      
      if (!activity) {
        return res.status(404).json({
          code: 404,
          message: '活动不存在或未开始/已结束',
          data: null,
          timestamp: Date.now()
        } as ApiResponse<null>);
      }

      res.json({
        code: 200,
        message: 'success',
        data: activity,
        timestamp: Date.now()
      } as ApiResponse<typeof activity>);
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '获取活动信息失败',
        data: null,
        timestamp: Date.now()
      } as ApiResponse<null>);
    }
  }
}
