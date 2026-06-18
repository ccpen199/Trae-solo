import type {
  Ranking,
  RankingItem,
  EvaluationReport,
  EvaluationTarget,
  CompareResult,
  DimensionScore,
} from '../../../shared/types.js';
import { rankingRepo } from '../repositories/rankingRepo.js';
import { reportRepo, targetRepo, categoryRepo } from '../repositories/evaluationRepo.js';

export const rankingService = {
  async getRankings(params: {
    page: number;
    pageSize: number;
    category?: string;
    city?: string;
  }) {
    return rankingRepo.list(params);
  },

  async getRankingById(id: number): Promise<Ranking | null> {
    return rankingRepo.findById(id);
  },

  async getLatestRanking(category: string, city: string, period: string): Promise<Ranking | null> {
    return rankingRepo.findLatest(category, city, period);
  },

  async generateRanking(
    category: string,
    city: string,
    period: string
  ): Promise<Ranking> {
    const existing = await this.getLatestRanking(category, city, period);
    if (existing) return existing;

    const { items: reports } = reportRepo.list({
      page: 1,
      pageSize: 100,
      category,
      status: 'published',
    });

    const categoryReports = reports.filter((r) => r.target?.category === category);

    const sorted = [...categoryReports].sort((a, b) => b.overallScore - a.overallScore);

    const rankingItems: Omit<RankingItem, 'id'>[] = sorted.map((r, idx) => ({
      rank: idx + 1,
      targetId: r.targetId,
      targetName: r.target?.name || '',
      overallScore: r.overallScore,
      previousRank: undefined,
      changeTrend: 'stable' as const,
      reportId: r.id,
      category,
      city,
      dimensionScores: r.dimensionScores,
    }));

    return rankingRepo.create({ category, city, period, items: rankingItems });
  },

  async compareTargets(targetIds: number[]): Promise<CompareResult> {
    const targets: EvaluationTarget[] = [];
    const reports: EvaluationReport[] = [];

    for (const id of targetIds) {
      const target = targetRepo.findById(id);
      if (target) targets.push(target);

      const { items: targetReports } = reportRepo.list({
        page: 1,
        pageSize: 1,
        targetId: id,
        status: 'published',
      });
      if (targetReports.length > 0) reports.push(targetReports[0]);
    }

    const indicatorMap = new Map<
      string,
      { indicatorName: string; scores: { targetId: number; score: number }[] }
    >();

    for (const report of reports) {
      for (const is of report.indicatorScores) {
        if (!is.indicatorCode) continue;
        if (!indicatorMap.has(is.indicatorCode)) {
          indicatorMap.set(is.indicatorCode, {
            indicatorName: is.indicatorName || is.indicatorCode,
            scores: [],
          });
        }
        indicatorMap.get(is.indicatorCode)!.scores.push({
          targetId: report.targetId,
          score: is.score,
        });
      }
    }

    const indicatorComparison = Array.from(indicatorMap.entries()).map(
      ([indicatorCode, { indicatorName, scores }]) => {
        const sortedScores = [...scores].sort((a, b) => b.score - a.score);
        const rankedScores = scores.map((s) => ({
          targetId: s.targetId,
          score: s.score,
          rank: sortedScores.findIndex((x) => x.targetId === s.targetId) + 1,
        }));
        return { indicatorCode, indicatorName, scores: rankedScores };
      }
    );

    const avgScores = reports.map((r) => ({ name: r.target?.name || '', score: r.overallScore }));
    const highest = avgScores.reduce((a, b) => (a.score > b.score ? a : b));
    const analysis =
      reports.length >= 2
        ? `综合对比分析：${highest.name}以${highest.score}分领先，各维度表现均衡，建议优先选择。`
        : '请选择至少两个对象进行对比';

    return {
      targets,
      reports,
      indicatorComparison,
      analysis,
    };
  },

  async getCategories() {
    return categoryRepo.list();
  },
};
