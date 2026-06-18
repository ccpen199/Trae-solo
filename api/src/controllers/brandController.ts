import type { Request, Response } from 'express';
import { success, error, paginated } from '../utils/response.js';
import { brandService } from '../services/brandService.js';

export const brandController = {
  async getBrandInfo(req: Request, res: Response) {
    try {
      const brandId = parseInt(req.params.id || (req as any).brandId);
      if (!brandId) return error(res, '品牌ID缺失');

      const brand = await brandService.getBrandById(brandId);
      if (!brand) return error(res, '品牌不存在', 1, 404);
      return success(res, brand);
    } catch (e: any) {
      return error(res, e.message || '获取品牌信息失败');
    }
  },

  async getBrandReports(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const brandId = parseInt(req.params.id || (req as any).brandId || req.query.brandId as string);
      if (!brandId) return error(res, '品牌ID缺失');

      const result = await brandService.getBrandReports(brandId, page, pageSize);
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取品牌报告失败');
    }
  },

  async getReputationData(req: Request, res: Response) {
    try {
      const brandId = parseInt(req.params.id || (req as any).brandId || req.query.brandId as string);
      if (!brandId) return error(res, '品牌ID缺失');

      const data = await brandService.getReputationData(brandId);
      return success(res, data);
    } catch (e: any) {
      return error(res, e.message || '获取舆情数据失败');
    }
  },

  async submitAppeal(req: Request, res: Response) {
    try {
      const { brandId, reportId, reason, evidence } = req.body;
      if (!brandId || !reportId || !reason) {
        return error(res, '请填写完整申诉信息');
      }

      const appeal = await brandService.submitAppeal({
        brandId,
        reportId,
        reason,
        evidence: evidence || [],
      });
      return success(res, appeal, '申诉已提交');
    } catch (e: any) {
      return error(res, e.message || '提交申诉失败');
    }
  },

  async getAppeals(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;
      const brandId = parseInt((req as any).brandId || req.query.brandId as string);

      const result = await brandService.getAppeals({ page, pageSize, status, brandId });
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取申诉列表失败');
    }
  },

  async getAppealById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const appeal = await brandService.getAppealById(id);
      if (!appeal) return error(res, '申诉不存在', 1, 404);
      return success(res, appeal);
    } catch (e: any) {
      return error(res, e.message || '获取申诉详情失败');
    }
  },
};
