import type {
  JobPost,
  UserProfile,
  CompetencyModel,
} from '../../shared/types/index.js';
import { jobPosts, competencyModels } from '../data/mockData.js';

export class MatchAlgorithmService {
  static matchJob(job: JobPost, user: UserProfile): { matchScore: number; matchBreakdown: { competency: number; growth: number; preference: number; implicit: number } } {
    const competency = MatchAlgorithmService.calcCompetencyScore(job, user);
    const growth = MatchAlgorithmService.calcGrowthScore(job);
    const preference = MatchAlgorithmService.calcPreferenceScore(job, user);
    const implicit = MatchAlgorithmService.calcImplicitScore(job);
    const matchScore = Math.round((competency * 0.4 + growth * 0.25 + preference * 0.2 + implicit * 0.15) * 10) / 10;
    return {
      matchScore,
      matchBreakdown: {
        competency: Math.round(competency * 10) / 10,
        growth: Math.round(growth * 10) / 10,
        preference: Math.round(preference * 10) / 10,
        implicit: Math.round(implicit * 10) / 10,
      },
    };
  }

  static calcCompetencyScore(job: JobPost, user: UserProfile): number {
    const model = competencyModels.find(c => c.jobId === job.requiredCompetencyModelId);
    if (!model || !user.jobseekerProfile) return 60;
    const userSkills = user.jobseekerProfile.skills;
    const matched = model.hardSkills.filter(hs => userSkills.some(us => us.name.includes(hs.name) || hs.name.includes(us.name)));
    const hsMatch = matched.length > 0 ? matched.reduce((s, hs) => {
      const us = userSkills.find(u => hs.name.includes(u.name) || u.name.includes(hs.name));
      return s + Math.min(1, (us?.level || 1) / hs.targetLevel);
    }, 0) / model.hardSkills.length : 0.3;
    const exp = user.jobseekerProfile.yearsOfExperience;
    const expScore = Math.min(1, exp / model.yearsOfExperience.ideal);
    const certs = model.certifications.filter(c => user.jobseekerProfile!.certifications.some(uc => uc.name.includes(c.name)));
    const certScore = model.certifications.length > 0 ? certs.length / model.certifications.length : 1;
    return Math.round(40 + 35 * hsMatch * 100 + 15 * expScore + 10 * certScore);
  }

  static calcGrowthScore(job: JobPost): number {
    const gt = job.growthTags;
    const evolutionScore = { stable: 60, growing: 80, leading: 100 }[gt.techStackEvolution];
    const boolScore = [gt.hasTrainingSystem, gt.hasRotationProgram, gt.mentorshipProgram, gt.promotionPathClear, gt.learningBudget].filter(Boolean).length;
    return Math.round(evolutionScore * 0.5 + (boolScore / 5) * 50);
  }

  static calcPreferenceScore(job: JobPost, user: UserProfile): number {
    if (!user.jobseekerProfile) return 70;
    let score = 60;
    const targetId = user.jobseekerProfile.targetJobId;
    if (targetId && job.requiredCompetencyModelId === targetId) score += 20;
    const [min, max] = job.salaryRange;
    if (max >= 20000 && min <= 50000) score += 10;
    const cities = ['北京', '上海', '深圳', '杭州'];
    if (cities.includes(job.city)) score += 10;
    return Math.min(100, score);
  }

  static calcImplicitScore(job: JobPost): number {
    const im = job.implicitSignals;
    const blogScore = { none: 50, low: 65, medium: 80, high: 95 }[im.techBlogFrequency];
    const ossScore = Math.min(100, 50 + im.openSourceContributions * 5);
    const promoScore = Math.min(100, im.internalPromotionRate * 150);
    const tenureScore = im.avgTenureMonths >= 36 ? 100 : im.avgTenureMonths >= 24 ? 80 : im.avgTenureMonths >= 12 ? 60 : 40;
    return Math.round(blogScore * 0.3 + ossScore * 0.2 + promoScore * 0.3 + tenureScore * 0.2);
  }

  static recommendJobs(user: UserProfile, params: { page?: number; pageSize?: number } = {}) {
    const { page = 1, pageSize = 20 } = params;
    const matched = jobPosts.map(jp => {
      const { matchScore, matchBreakdown } = MatchAlgorithmService.matchJob(jp, user);
      return { ...jp, matchScore, matchBreakdown };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const total = matched.length;
    const start = (page - 1) * pageSize;
    const data = matched.slice(start, start + pageSize);
    return { data, total, page, pageSize };
  }
}
