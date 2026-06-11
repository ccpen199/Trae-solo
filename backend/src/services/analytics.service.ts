import { AppDataSource } from "../database/data-source";
import { Candidate, CandidateStage } from "../entities/Candidate";
import { Position } from "../entities/Position";
import { Interview } from "../entities/Interview";
import { TalentTag } from "../entities/TalentTag";
import { Between, MoreThanOrEqual, LessThanOrEqual, In } from "typeorm";

export interface FunnelStageData {
  stage: CandidateStage;
  stageName: string;
  count: number;
  conversionRate: number;
  avgDurationDays: number;
}

export interface PositionHeatmapData {
  positionId: number;
  positionTitle: string;
  department: string;
  applicationCount: number;
  interviewCount: number;
  hireCount: number;
  heatScore: number;
}

export interface TalentTagStats {
  tagId: number;
  tagName: string;
  category: string;
  count: number;
  hireRate: number;
  avgSalary: number;
}

export class AnalyticsService {
  private static stageOrder: CandidateStage[] = [
    "applied",
    "screening",
    "ai_screened",
    "interview_invited",
    "interview_scheduled",
    "first_interview",
    "second_interview",
    "background_check",
    "offer",
    "hired",
    "rejected",
    "withdrawn",
  ];

  private static stageNames: Record<CandidateStage, string> = {
    applied: "简历投递",
    screening: "人工筛选",
    ai_screened: "AI初筛",
    interview_invited: "面试邀约",
    interview_scheduled: "面试排期",
    first_interview: "初试",
    second_interview: "复试",
    background_check: "背景调查",
    offer: "录用",
    hired: "已入职",
    rejected: "已拒绝",
    withdrawn: "已撤回",
  };

  public static async getRecruitmentFunnel(positionId?: number, startDate?: Date, endDate?: Date): Promise<FunnelStageData[]> {
    const candidateRepository = AppDataSource.getRepository(Candidate);

    let whereClause: any = {};
    if (positionId) {
      whereClause.positionId = positionId;
    }
    if (startDate && endDate) {
      whereClause.createdAt = Between(startDate, endDate);
    }

    const candidates = await candidateRepository.find({
      where: whereClause,
      order: { createdAt: "ASC" },
    });

    const stageData: Map<CandidateStage, { count: number; durations: number[] }> = new Map();

    for (const stage of this.stageOrder) {
      stageData.set(stage, { count: 0, durations: [] });
    }

    const candidateStageTransitions: Map<number, Map<CandidateStage, Date>> = new Map();

    for (const candidate of candidates) {
      const stage = candidate.stage;
      const data = stageData.get(stage);
      if (data) {
        data.count++;
      }

      if (!candidateStageTransitions.has(candidate.id)) {
        candidateStageTransitions.set(candidate.id, new Map());
      }
      candidateStageTransitions.get(candidate.id)!.set(stage, candidate.updatedAt);
    }

    for (const [, transitions] of candidateStageTransitions) {
      let prevStage: CandidateStage | null = null;
      let prevDate: Date | null = null;

      for (const stage of this.stageOrder) {
        const date = transitions.get(stage);
        if (date && prevStage && prevDate) {
          const duration = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          const stageInfo = stageData.get(stage);
          if (stageInfo) {
            stageInfo.durations.push(duration);
          }
        }
        if (date) {
          prevStage = stage;
          prevDate = date;
        }
      }
    }

    const result: FunnelStageData[] = [];
    let prevCount = 0;

    for (let i = 0; i < this.stageOrder.length; i++) {
      const stage = this.stageOrder[i];
      const data = stageData.get(stage)!;

      const conversionRate = i === 0 || prevCount === 0 ? 100 : Math.round((data.count / prevCount) * 100);
      const avgDurationDays =
        data.durations.length > 0 ? Math.round((data.durations.reduce((a, b) => a + b, 0) / data.durations.length) * 10) / 10 : 0;

      result.push({
        stage,
        stageName: this.stageNames[stage],
        count: data.count,
        conversionRate,
        avgDurationDays,
      });

      if (data.count > 0) {
        prevCount = data.count;
      }
    }

    return result;
  }

  public static async getPositionHeatmap(startDate?: Date, endDate?: Date): Promise<PositionHeatmapData[]> {
    const positionRepository = AppDataSource.getRepository(Position);
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const interviewRepository = AppDataSource.getRepository(Interview);

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = { createdAt: Between(startDate, endDate) };
    }

    const positions = await positionRepository.find({
      where: { status: MoreThanOrEqual("approved") as any },
    });

    const result: PositionHeatmapData[] = [];

    for (const position of positions) {
      const applicationCount = await candidateRepository.count({
        where: { positionId: position.id, ...dateFilter },
      });

      const interviewCount = await interviewRepository.count({
        where: { positionId: position.id, ...(startDate && endDate ? { createdAt: Between(startDate, endDate) } : {}) },
      });

      const hireCount = await candidateRepository.count({
        where: { positionId: position.id, stage: "hired", ...(startDate && endDate ? { updatedAt: Between(startDate, endDate) } : {}) },
      });

      const heatScore = Math.round(
        applicationCount * 0.3 +
          interviewCount * 0.4 +
          hireCount * 0.5 +
          (position.hiredCount / Math.max(position.headcount, 1)) * 100 * 0.2
      );

      result.push({
        positionId: position.id,
        positionTitle: position.title,
        department: position.department,
        applicationCount,
        interviewCount,
        hireCount,
        heatScore: Math.min(heatScore, 100),
      });
    }

    return result.sort((a, b) => b.heatScore - a.heatScore);
  }

  public static async getTalentTagStats(category?: string): Promise<TalentTagStats[]> {
    const tagRepository = AppDataSource.getRepository(TalentTag);
    const candidateRepository = AppDataSource.getRepository(Candidate);

    let whereClause: any = { isActive: true };
    if (category) {
      whereClause.category = category;
    }

    const tags = await tagRepository.find({
      where: whereClause,
      relations: ["candidates"],
      order: { usageCount: "DESC" },
    });

    const result: TalentTagStats[] = [];

    for (const tag of tags) {
      const candidates = tag.candidates || [];
      const hiredCandidates = candidates.filter((c) => c.stage === "hired");

      const hireRate = candidates.length > 0 ? Math.round((hiredCandidates.length / candidates.length) * 100) : 0;

      const salaries = candidates
        .filter((c) => c.expectedSalaryMin)
        .map((c) => c.expectedSalaryMin!);
      const avgSalary =
        salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;

      result.push({
        tagId: tag.id,
        tagName: tag.name,
        category: tag.category,
        count: candidates.length,
        hireRate,
        avgSalary,
      });
    }

    return result.sort((a, b) => b.count - a.count);
  }

  public static async getDashboardStats(startDate?: Date, endDate?: Date): Promise<{
    totalPositions: number;
    activePositions: number;
    totalCandidates: number;
    pendingScreening: number;
    interviewsToday: number;
    offersPending: number;
    hiredThisMonth: number;
    avgTimeToHire: number;
    conversionRate: number;
  }> {
    const positionRepository = AppDataSource.getRepository(Position);
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const interviewRepository = AppDataSource.getRepository(Interview);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const totalPositions = await positionRepository.count();
    const activePositions = await positionRepository.count({ where: { status: "published" } });

    let candidateFilter: any = {};
    if (startDate && endDate) {
      candidateFilter.createdAt = Between(startDate, endDate);
    }
    const totalCandidates = await candidateRepository.count({ where: candidateFilter });

    const pendingScreening = await candidateRepository.count({
      where: { stage: In(["screening", "ai_screened"]) as any },
    });

    const interviewsToday = await interviewRepository.count({
      where: {
        scheduledAt: Between(today, tomorrow),
        status: In(["scheduled", "in_progress"]) as any,
      },
    });

    const offersPending = await candidateRepository.count({ where: { stage: "offer" } });

    const hiredThisMonth = await candidateRepository.count({
      where: {
        stage: "hired",
        updatedAt: MoreThanOrEqual(monthStart),
      },
    });

    const hiredCandidates = await candidateRepository.find({
      where: { stage: "hired" },
      select: ["createdAt", "updatedAt"],
    });

    const avgTimeToHire =
      hiredCandidates.length > 0
        ? Math.round(
            hiredCandidates.reduce((sum, c) => {
              const days = (c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / hiredCandidates.length
          )
        : 0;

    const funnel = await this.getRecruitmentFunnel(undefined, startDate, endDate);
    const appliedCount = funnel.find((f) => f.stage === "applied")?.count || 0;
    const hiredCount = funnel.find((f) => f.stage === "hired")?.count || 0;
    const conversionRate = appliedCount > 0 ? Math.round((hiredCount / appliedCount) * 100 * 10) / 10 : 0;

    return {
      totalPositions,
      activePositions,
      totalCandidates,
      pendingScreening,
      interviewsToday,
      offersPending,
      hiredThisMonth,
      avgTimeToHire,
      conversionRate,
    };
  }
}


