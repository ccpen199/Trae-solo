import type {
  EvaluationPlan,
  ReviewTask,
  Appeal,
  WeightConfig,
  Reviewer,
  Brand,
  EvaluationReport,
} from '../../../shared/types.js';
import { planRepo, taskRepo, appealRepo, weightConfigRepo, auditLogRepo } from '../repositories/adminRepo.js';
import { reviewerRepo, brandRepo } from '../repositories/userRepo.js';
import { reportRepo } from '../repositories/evaluationRepo.js';
import db from '../utils/database.js';

export const adminService = {
  async getPlans(page: number, pageSize: number, status?: string) {
    return planRepo.list(page, pageSize, status);
  },

  async getPlanById(id: number): Promise<EvaluationPlan | null> {
    return planRepo.findById(id);
  },

  async createPlan(data: {
    name: string;
    category: string;
    city: string;
    startDate: string;
    endDate: string;
  }): Promise<EvaluationPlan> {
    return planRepo.create(data);
  },

  async updatePlanStatus(id: number, status: EvaluationPlan['status']): Promise<EvaluationPlan | null> {
    return planRepo.updateStatus(id, status);
  },

  async createTask(data: {
    planId: number;
    targetId: number;
    title: string;
    description: string;
    deadline: string;
    requiredQualifications: string[];
    reward: number;
  }): Promise<ReviewTask> {
    return taskRepo.create(data);
  },

  async getReviewers(page: number, pageSize: number, status?: string) {
    return reviewerRepo.list(page, pageSize, status);
  },

  async getReviewerById(id: number): Promise<Reviewer | null> {
    return reviewerRepo.findById(id);
  },

  async auditReviewer(id: number, status: Reviewer['auditStatus']): Promise<Reviewer | null> {
    return reviewerRepo.updateAuditStatus(id, status);
  },

  async getBrands(page: number, pageSize: number, status?: string) {
    return brandRepo.list(page, pageSize, status);
  },

  async getBrandById(id: number): Promise<Brand | null> {
    return brandRepo.findById(id);
  },

  async auditBrand(id: number, status: Brand['auditStatus']): Promise<Brand | null> {
    return brandRepo.updateAuditStatus(id, status);
  },

  async getReports(page: number, pageSize: number, status?: string) {
    return reportRepo.list({ page, pageSize, status });
  },

  async getReportById(id: number): Promise<EvaluationReport | null> {
    return reportRepo.findById(id);
  },

  async auditReport(
    reportId: number,
    adminId: number,
    action: 'approve' | 'reject' | 'cross_validate',
    comment: string
  ): Promise<EvaluationReport | null> {
    let status: EvaluationReport['status'];
    switch (action) {
      case 'approve':
        status = 'approved';
        break;
      case 'reject':
        status = 'rejected';
        break;
      case 'cross_validate':
        status = 'cross_validating';
        break;
      default:
        status = 'reviewing';
    }

    auditLogRepo.create({ reportId, adminId, action, comment });
    reportRepo.updateStatus(reportId, status);

    if (status === 'approved') {
      reportRepo.updateStatus(reportId, 'published');
    }

    return reportRepo.findById(reportId);
  },

  async getAuditLogs(reportId: number) {
    return auditLogRepo.listByReportId(reportId);
  },

  async getAppeals(page: number, pageSize: number, status?: string) {
    return appealRepo.list({ page, pageSize, status });
  },

  async getAppealById(id: number): Promise<Appeal | null> {
    return appealRepo.findById(id);
  },

  async processAppeal(
    id: number,
    status: Appeal['status'],
    processorNote: string
  ): Promise<Appeal | null> {
    return appealRepo.process(id, status, processorNote);
  },

  async getWeightConfigs(): Promise<WeightConfig[]> {
    return weightConfigRepo.list();
  },

  async getWeightConfig(category: string): Promise<WeightConfig | null> {
    return weightConfigRepo.findByCategory(category);
  },

  async updateWeightConfig(config: WeightConfig): Promise<WeightConfig | null> {
    return weightConfigRepo.update(config.category, config);
  },

  async getDashboardStats() {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const reportCount = db.prepare('SELECT COUNT(*) as count FROM evaluation_reports').get() as { count: number };
    const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number };
    const reviewerCount = db.prepare('SELECT COUNT(*) as count FROM reviewers').get() as { count: number };
    const pendingReviews = db.prepare("SELECT COUNT(*) as count FROM evaluation_reports WHERE status = 'submitted' OR status = 'reviewing'").get() as { count: number };
    const pendingAppeals = db.prepare("SELECT COUNT(*) as count FROM appeals WHERE status = 'pending'").get() as { count: number };
    const publishedReports = db.prepare("SELECT COUNT(*) as count FROM evaluation_reports WHERE status = 'published'").get() as { count: number };
    const rankingCount = db.prepare('SELECT COUNT(*) as count FROM rankings').get() as { count: number };

    return {
      userCount: userCount.count,
      reportCount: reportCount.count,
      brandCount: brandCount.count,
      reviewerCount: reviewerCount.count,
      pendingReviews: pendingReviews.count,
      pendingAppeals: pendingAppeals.count,
      publishedReports: publishedReports.count,
      rankingCount: rankingCount.count,
    };
  },
};
