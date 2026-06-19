import type {
  Industry,
  CompetencyModel,
  PromotionPath,
  JobRole,
} from '../../shared/types/index.js';
import { industries, competencyModels, promotionPaths } from '../data/mockData.js';

export class CompetencyGraphService {
  static getIndustries(): Industry[] {
    return industries;
  }

  static getJobs(params: {
    industryId?: string; keyword?: string; page?: number; pageSize?: number } = {}) {
    const { industryId, keyword = '', page = 1, pageSize = 20 } = params;
    let allJobs: (JobRole & { industryId: string; industryName: string; categoryName: string })[] = [];
    industries.forEach(ind => {
      if (industryId && ind.id !== industryId) return;
      ind.categories.forEach(cat => {
        cat.jobs.forEach(job => {
          if (keyword && !job.name.includes(keyword)) return;
          allJobs.push({
            ...job,
            industryId: ind.id,
            industryName: ind.name,
            categoryName: cat.name,
          });
        });
      });
    });
    const total = allJobs.length;
    const start = (page - 1) * pageSize;
    const data = allJobs.slice(start, start + pageSize);
    return { data, total, page, pageSize };
  }

  static getCompetencyModel(jobId: string): CompetencyModel | undefined {
    return competencyModels.find(c => c.jobId === jobId);
  }

  static getPromotionPath(jobId: string): PromotionPath | undefined {
    return promotionPaths.find(p => p.fromJobId === jobId);
  }
}
