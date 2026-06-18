import type { Request, Response } from 'express';
import { success, error, paginated } from '../utils/response.js';
import { rankingService } from '../services/rankingService.js';
import { evaluationService } from '../services/evaluationService.js';

export const publicController = {
  async getRankings(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const category = req.query.category as string | undefined;
      const city = req.query.city as string | undefined;

      const result = await rankingService.getRankings({ page, pageSize, category, city });
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取榜单失败');
    }
  },

  async getRankingById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const ranking = await rankingService.getRankingById(id);
      if (!ranking) return error(res, '榜单不存在', 1, 404);
      return success(res, ranking);
    } catch (e: any) {
      return error(res, e.message || '获取榜单失败');
    }
  },

  async getReportById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const report = await evaluationService.getReportById(id);
      if (!report) return error(res, '报告不存在', 1, 404);
      if (report.status !== 'published') {
        return error(res, '该报告尚未发布', 1, 403);
      }
      return success(res, report);
    } catch (e: any) {
      return error(res, e.message || '获取报告失败');
    }
  },

  async getReports(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const category = req.query.category as string | undefined;
      const keyword = req.query.keyword as string | undefined;

      const result = await evaluationService.getReports({
        page,
        pageSize,
        category,
        status: 'published',
      });

      let filteredItems = result.items;
      if (keyword) {
        const kw = keyword.toLowerCase();
        filteredItems = result.items.filter(
          (r) =>
            r.title.toLowerCase().includes(kw) ||
            r.summary.toLowerCase().includes(kw) ||
            r.target?.name.toLowerCase().includes(kw)
        );
      }

      return paginated(res, filteredItems, filteredItems.length, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取报告列表失败');
    }
  },

  async getTargets(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const category = req.query.category as string | undefined;
      const city = req.query.city as string | undefined;
      const keyword = req.query.keyword as string | undefined;

      const result = await evaluationService.getTargets({ page, pageSize, category, city, keyword });
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取评测对象失败');
    }
  },

  async getTargetById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const target = await evaluationService.getTargetById(id);
      if (!target) return error(res, '评测对象不存在', 1, 404);
      return success(res, target);
    } catch (e: any) {
      return error(res, e.message || '获取评测对象失败');
    }
  },

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await evaluationService.getCategories();
      return success(res, categories);
    } catch (e: any) {
      return error(res, e.message || '获取分类失败');
    }
  },

  async compareTargets(req: Request, res: Response) {
    try {
      const { targetIds } = req.body;
      if (!targetIds || !Array.isArray(targetIds) || targetIds.length < 2) {
        return error(res, '请至少选择两个评测对象进行对比');
      }
      const result = await rankingService.compareTargets(targetIds);
      return success(res, result);
    } catch (e: any) {
      return error(res, e.message || '对比失败');
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
