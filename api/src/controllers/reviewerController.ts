import type { Request, Response } from 'express';
import { success, error, paginated } from '../utils/response.js';
import { evaluationService } from '../services/evaluationService.js';

export const reviewerController = {
  async getTasks(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;
      const reviewerId = parseInt((req as any).reviewerId || req.query.reviewerId as string);

      const result = await evaluationService.getTasks({ page, pageSize, status, reviewerId });
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取任务失败');
    }
  },

  async getTaskById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const task = await evaluationService.getTaskById(id);
      if (!task) return error(res, '任务不存在', 1, 404);
      return success(res, task);
    } catch (e: any) {
      return error(res, e.message || '获取任务失败');
    }
  },

  async claimTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      const reviewerId = parseInt((req as any).reviewerId || req.body.reviewerId);
      if (!reviewerId) return error(res, '评测员ID缺失');

      const task = await evaluationService.claimTask(taskId, reviewerId);
      if (!task) return error(res, '任务不存在或已被领取');
      return success(res, task, '任务领取成功');
    } catch (e: any) {
      return error(res, e.message || '领取任务失败');
    }
  },

  async completeTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.id);
      const task = await evaluationService.completeTask(taskId);
      if (!task) return error(res, '任务不存在');
      return success(res, task, '任务已完成');
    } catch (e: any) {
      return error(res, e.message || '完成任务失败');
    }
  },

  async getMyReports(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;
      const reviewerId = parseInt((req as any).reviewerId || req.query.reviewerId as string);
      if (!reviewerId) return error(res, '评测员ID缺失');

      const result = await evaluationService.getReports({ page, pageSize, reviewerId, status });
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取报告列表失败');
    }
  },

  async submitReport(req: Request, res: Response) {
    try {
      const {
        targetId,
        reviewerId,
        title,
        summary,
        status,
        indicatorScores,
      } = req.body;

      if (!targetId || !reviewerId || !title || !summary || !indicatorScores) {
        return error(res, '请填写完整报告信息');
      }

      const report = await evaluationService.submitReport({
        targetId,
        reviewerId,
        title,
        summary,
        status,
        indicatorScores,
      });
      return success(res, report, '报告提交成功');
    } catch (e: any) {
      return error(res, e.message || '提交报告失败');
    }
  },

  async generateAutoReport(req: Request, res: Response) {
    try {
      const { targetId, reviewerId } = req.body;
      if (!targetId || !reviewerId) {
        return error(res, '缺少必要参数');
      }

      const report = await evaluationService.generateAutoReport(targetId, reviewerId);
      return success(res, report, '自动生成报告成功');
    } catch (e: any) {
      return error(res, e.message || '生成报告失败');
    }
  },

  async getDataSources(req: Request, res: Response) {
    try {
      const reportId = parseInt(req.params.reportId);
      const sources = await evaluationService.getDataSources(reportId);
      return success(res, sources);
    } catch (e: any) {
      return error(res, e.message || '获取数据源失败');
    }
  },

  async getIndicators(req: Request, res: Response) {
    try {
      const category = req.query.category as string | undefined;
      const indicators = await evaluationService.getIndicators(category);
      return success(res, indicators);
    } catch (e: any) {
      return error(res, e.message || '获取指标失败');
    }
  },
};
