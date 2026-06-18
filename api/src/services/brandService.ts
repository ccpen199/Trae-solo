import type { Brand, Appeal, ReputationData, EvaluationReport } from '../../../shared/types.js';
import { brandRepo } from '../repositories/userRepo.js';
import { appealRepo } from '../repositories/adminRepo.js';
import { reportRepo, targetRepo } from '../repositories/evaluationRepo.js';

export const brandService = {
  async getBrandById(id: number): Promise<Brand | null> {
    return brandRepo.findById(id);
  },

  async getBrands(params: { page: number; pageSize: number; status?: string }) {
    return brandRepo.list(params.page, params.pageSize, params.status);
  },

  async getBrandReports(brandId: number, page: number, pageSize: number) {
    const brand = brandRepo.findById(brandId);
    if (!brand) return { items: [], total: 0 };

    const { items: targets, total: targetTotal } = targetRepo.list({
      page: 1,
      pageSize: 100,
    });

    const brandTargets = targets.filter((t) => t.brandId === brandId);

    let allReports: EvaluationReport[] = [];
    for (const target of brandTargets) {
      const { items } = reportRepo.list({
        page: 1,
        pageSize: 10,
        targetId: target.id,
        status: 'published',
      });
      allReports = allReports.concat(items);
    }

    const start = (page - 1) * pageSize;
    return {
      items: allReports.slice(start, start + pageSize),
      total: allReports.length,
    };
  },

  async getReputationData(brandId: number): Promise<ReputationData> {
    const { items: reports } = await this.getBrandReports(brandId, 1, 50);
    const scores = reports.map((r) => r.overallScore);
    const overallScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 75;

    const trend: { date: string; score: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      trend.push({
        date: d.toISOString().slice(0, 10),
        score: Math.round((overallScore + (Math.random() - 0.5) * 10) * 100) / 100,
      });
    }

    const complaints: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      complaints.push({
        date: d.toISOString().slice(0, 10),
        count: Math.floor(Math.random() * 5),
      });
    }

    const sentimentDistribution = {
      positive: 60 + Math.floor(Math.random() * 20),
      neutral: 15 + Math.floor(Math.random() * 10),
      negative: 5 + Math.floor(Math.random() * 15),
    };
    const total = sentimentDistribution.positive + sentimentDistribution.neutral + sentimentDistribution.negative;
    sentimentDistribution.positive = Math.round((sentimentDistribution.positive / total) * 100);
    sentimentDistribution.neutral = Math.round((sentimentDistribution.neutral / total) * 100);
    sentimentDistribution.negative = 100 - sentimentDistribution.positive - sentimentDistribution.neutral;

    const competitorComparison = [
      { name: '竞品A', score: Math.round((overallScore + (Math.random() - 0.5) * 15) * 100) / 100 },
      { name: '竞品B', score: Math.round((overallScore + (Math.random() - 0.5) * 15) * 100) / 100 },
      { name: '行业平均', score: Math.round((overallScore - 5 + Math.random() * 5) * 100) / 100 },
    ];

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      trend,
      complaints,
      sentimentDistribution,
      competitorComparison,
    };
  },

  async submitAppeal(data: {
    brandId: number;
    reportId: number;
    reason: string;
    evidence: string[];
  }): Promise<Appeal> {
    return appealRepo.create(data);
  },

  async getAppeals(params: {
    page: number;
    pageSize: number;
    status?: string;
    brandId?: number;
  }) {
    return appealRepo.list(params);
  },

  async getAppealById(id: number): Promise<Appeal | null> {
    return appealRepo.findById(id);
  },
};
