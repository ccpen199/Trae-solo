import type {
  EvaluationReport,
  EvaluationTarget,
  IndicatorScore,
  EvaluationIndicator,
  ReviewTask,
  DataSource,
} from '../../../shared/types.js';
import { reportRepo, targetRepo, indicatorRepo, categoryRepo } from '../repositories/evaluationRepo.js';
import { reviewerRepo } from '../repositories/userRepo.js';
import { taskRepo } from '../repositories/adminRepo.js';
import { generateMockReport } from '../pipeline/dataPipeline.js';
import { calculateWeightedScore } from '../pipeline/weightCalculator.js';

export const evaluationService = {
  async getReports(params: {
    page: number;
    pageSize: number;
    targetId?: number;
    reviewerId?: number;
    status?: string;
    category?: string;
  }) {
    return reportRepo.list(params);
  },

  async getReportById(id: number): Promise<EvaluationReport | null> {
    const report = reportRepo.findById(id);
    if (!report) return null;

    const reviewer = reviewerRepo.findById(report.reviewerId);
    if (reviewer) {
      (report as any).reviewer = reviewer;
    }

    return report;
  },

  async submitReport(data: {
    targetId: number;
    reviewerId: number;
    title: string;
    summary: string;
    status?: EvaluationReport['status'];
    indicatorScores: IndicatorScore[];
  }): Promise<EvaluationReport> {
    const target = targetRepo.findById(data.targetId);
    if (!target) throw new Error('评测对象不存在');

    const category = target.category;
    const { overallScore, dimensionScores } = calculateWeightedScore(
      data.indicatorScores,
      category
    );

    const report = reportRepo.create({
      targetId: data.targetId,
      reviewerId: data.reviewerId,
      title: data.title,
      summary: data.summary,
      overallScore,
      dimensionScores,
      status: data.status || 'submitted',
      indicatorScores: data.indicatorScores,
    });

    reviewerRepo.incrementReports(data.reviewerId);

    return report;
  },

  async generateAutoReport(targetId: number, reviewerId: number): Promise<EvaluationReport> {
    const target = targetRepo.findById(targetId);
    if (!target) throw new Error('评测对象不存在');

    const indicators = indicatorRepo.listByCategory(target.category);
    const mockReport = generateMockReport(targetId, reviewerId, target.category, target, indicators);

    return reportRepo.create({
      targetId: mockReport.targetId,
      reviewerId: mockReport.reviewerId,
      title: mockReport.title,
      summary: mockReport.summary,
      overallScore: mockReport.overallScore,
      dimensionScores: mockReport.dimensionScores,
      status: 'published',
      indicatorScores: mockReport.indicatorScores,
    });
  },

  async getDataSources(reportId: number): Promise<DataSource[]> {
    const report = reportRepo.findById(reportId);
    if (!report) return [];

    const allSources: DataSource[] = [];
    for (const is of report.indicatorScores) {
      allSources.push(...is.dataSources);
    }
    return allSources;
  },

  async getTargets(params: {
    page: number;
    pageSize: number;
    category?: string;
    city?: string;
    keyword?: string;
  }) {
    return targetRepo.list(params);
  },

  async getTargetById(id: number): Promise<EvaluationTarget | null> {
    return targetRepo.findById(id);
  },

  async createTarget(data: {
    name: string;
    category: string;
    city: string;
    brandId?: number;
    description: string;
  }): Promise<EvaluationTarget> {
    return targetRepo.create(data);
  },

  async getIndicators(category?: string): Promise<EvaluationIndicator[]> {
    if (category) {
      return indicatorRepo.listByCategory(category);
    }
    return indicatorRepo.list();
  },

  async getCategories() {
    return categoryRepo.list();
  },

  async getTasks(params: {
    page: number;
    pageSize: number;
    status?: string;
    reviewerId?: number;
  }) {
    return taskRepo.list(params);
  },

  async getTaskById(id: number): Promise<ReviewTask | null> {
    return taskRepo.findById(id);
  },

  async claimTask(taskId: number, reviewerId: number): Promise<ReviewTask | null> {
    return taskRepo.assign(taskId, reviewerId);
  },

  async completeTask(taskId: number): Promise<ReviewTask | null> {
    return taskRepo.complete(taskId);
  },
};
