import type { Request, Response } from 'express';
import { success, error, paginated } from '../utils/response.js';
import { adminService } from '../services/adminService.js';
import { rankingService } from '../services/rankingService.js';

export const adminController = {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      return success(res, stats);
    } catch (e: any) {
      return error(res, e.message || '获取统计数据失败');
    }
  },

  async getPlans(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await adminService.getPlans(page, pageSize, status);
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取评测计划失败');
    }
  },

  async getPlanById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const plan = await adminService.getPlanById(id);
      if (!plan) return error(res, '评测计划不存在', 1, 404);
      return success(res, plan);
    } catch (e: any) {
      return error(res, e.message || '获取评测计划失败');
    }
  },

  async createPlan(req: Request, res: Response) {
    try {
      const { name, category, city, startDate, endDate } = req.body;
      if (!name || !category || !city || !startDate || !endDate) {
        return error(res, '请填写完整计划信息');
      }

      const plan = await adminService.createPlan({ name, category, city, startDate, endDate });
      return success(res, plan, '计划创建成功');
    } catch (e: any) {
      return error(res, e.message || '创建计划失败');
    }
  },

  async updatePlanStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) return error(res, '状态不能为空');

      const plan = await adminService.updatePlanStatus(id, status);
      return success(res, plan, '状态更新成功');
    } catch (e: any) {
      return error(res, e.message || '更新状态失败');
    }
  },

  async createTask(req: Request, res: Response) {
    try {
      const {
        planId,
        targetId,
        title,
        description,
        deadline,
        requiredQualifications,
        reward,
      } = req.body;

      if (!planId || !targetId || !title || !deadline) {
        return error(res, '请填写完整任务信息');
      }

      const task = await adminService.createTask({
        planId,
        targetId,
        title,
        description: description || '',
        deadline,
        requiredQualifications: requiredQualifications || [],
        reward: reward || 0,
      });
      return success(res, task, '任务创建成功');
    } catch (e: any) {
      return error(res, e.message || '创建任务失败');
    }
  },

  async getReviewers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await adminService.getReviewers(page, pageSize, status);
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取评测员列表失败');
    }
  },

  async auditReviewer(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) return error(res, '审核状态不能为空');

      const reviewer = await adminService.auditReviewer(id, status);
      return success(res, reviewer, '审核完成');
    } catch (e: any) {
      return error(res, e.message || '审核失败');
    }
  },

  async getBrands(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await adminService.getBrands(page, pageSize, status);
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取品牌列表失败');
    }
  },

  async auditBrand(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status) return error(res, '审核状态不能为空');

      const brand = await adminService.auditBrand(id, status);
      return success(res, brand, '审核完成');
    } catch (e: any) {
      return error(res, e.message || '审核失败');
    }
  },

  async getReports(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await adminService.getReports(page, pageSize, status);
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取报告列表失败');
    }
  },

  async getReportById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const report = await adminService.getReportById(id);
      if (!report) return error(res, '报告不存在', 1, 404);
      return success(res, report);
    } catch (e: any) {
      return error(res, e.message || '获取报告失败');
    }
  },

  async auditReport(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { action, comment, adminId } = req.body;
      if (!action) return error(res, '审核操作不能为空');

      const report = await adminService.auditReport(
        id,
        adminId || 1,
        action,
        comment || ''
      );
      return success(res, report, '审核完成');
    } catch (e: any) {
      return error(res, e.message || '审核失败');
    }
  },

  async getAuditLogs(req: Request, res: Response) {
    try {
      const reportId = parseInt(req.params.reportId);
      const logs = await adminService.getAuditLogs(reportId);
      return success(res, logs);
    } catch (e: any) {
      return error(res, e.message || '获取审核日志失败');
    }
  },

  async getAppeals(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await adminService.getAppeals(page, pageSize, status);
      return paginated(res, result.items, result.total, page, pageSize);
    } catch (e: any) {
      return error(res, e.message || '获取申诉列表失败');
    }
  },

  async getAppealById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const appeal = await adminService.getAppealById(id);
      if (!appeal) return error(res, '申诉不存在', 1, 404);
      return success(res, appeal);
    } catch (e: any) {
      return error(res, e.message || '获取申诉详情失败');
    }
  },

  async processAppeal(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { status, processorNote } = req.body;
      if (!status) return error(res, '处理状态不能为空');

      const appeal = await adminService.processAppeal(id, status, processorNote || '');
      return success(res, appeal, '处理完成');
    } catch (e: any) {
      return error(res, e.message || '处理失败');
    }
  },

  async getWeightConfigs(req: Request, res: Response) {
    try {
      const configs = await adminService.getWeightConfigs();
      return success(res, configs);
    } catch (e: any) {
      return error(res, e.message || '获取权重配置失败');
    }
  },

  async updateWeightConfig(req: Request, res: Response) {
    try {
      const config = req.body;
      if (!config.category || !config.dimensions) {
        return error(res, '权重配置不完整');
      }

      const updated = await adminService.updateWeightConfig(config);
      return success(res, updated, '权重配置已更新');
    } catch (e: any) {
      return error(res, e.message || '更新权重配置失败');
    }
  },

  async generateRanking(req: Request, res: Response) {
    try {
      const { category, city, period } = req.body;
      if (!category || !city || !period) {
        return error(res, '请填写完整信息');
      }

      const ranking = await rankingService.generateRanking(category, city, period);
      return success(res, ranking, '榜单生成成功');
    } catch (e: any) {
      return error(res, e.message || '生成榜单失败');
    }
  },
};
