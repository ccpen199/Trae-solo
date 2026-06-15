import { ChannelROI, FunnelMetrics, RetentionAnalysis } from '../../shared/types/index.js';

export function calculateChannelROIData(
  rawData: ChannelROI[],
  options?: {
    channels?: string[];
    startMonth?: string;
    endMonth?: string;
  }
): ChannelROI[] {
  let data = [...rawData];

  if (options?.channels && options.channels.length > 0) {
    data = data.filter(d => options.channels!.includes(d.channel));
  }

  if (options?.startMonth) {
    data = data.filter(d => d.month >= options.startMonth!);
  }

  if (options?.endMonth) {
    data = data.filter(d => d.month <= options.endMonth!);
  }

  return data;
}

export function aggregateChannelROI(
  data: ChannelROI[]
): Array<{
  channel: string;
  totalCost: number;
  totalHires: number;
  totalApplications: number;
  totalInterviews: number;
  avgCPA: number;
  avgQuality: number;
  conversionRate: number;
}> {
  const grouped = new Map<string, ChannelROI[]>();
  data.forEach(item => {
    const arr = grouped.get(item.channel) || [];
    arr.push(item);
    grouped.set(item.channel, arr);
  });

  const result = [];
  for (const [channel, items] of grouped.entries()) {
    const totalCost = items.reduce((s, i) => s + i.cost, 0);
    const totalHires = items.reduce((s, i) => s + i.hires, 0);
    const totalApplications = items.reduce((s, i) => s + i.applications, 0);
    const totalInterviews = items.reduce((s, i) => s + i.interviews, 0);
    const totalViews = items.reduce((s, i) => s + i.views, 0);

    result.push({
      channel,
      totalCost,
      totalHires,
      totalApplications,
      totalInterviews,
      avgCPA: totalHires > 0 ? Math.round(totalCost / totalHires) : totalCost,
      avgQuality: Math.round(items.reduce((s, i) => s + i.avgQualityScore, 0) / items.length),
      conversionRate: totalViews > 0 ? Math.round((totalHires / totalViews) * 10000) / 100 : 0,
    });
  }

  return result.sort((a, b) => b.totalHires - a.totalHires);
}

export function calculateFunnelMetrics(
  data: FunnelMetrics[]
): {
  stageNames: string[];
  stageValues: number[];
  stageRates: number[];
  overallConversion: number;
  bestPeriod: string;
} {
  const stageNames = [
    '曝光', '点击', '投递', '初筛通过', '面试', 'Offer', '入职', '30天留存', '90天留存',
  ];

  const totals = data.reduce(
    (acc, item) => {
      acc.views += item.views;
      acc.clicks += item.clicks;
      acc.applications += item.applications;
      acc.screeningPass += item.screeningPass;
      acc.interviews += item.interviews;
      acc.offers += item.offers;
      acc.hires += item.hires;
      acc.retention30d += item.retention30d;
      acc.retention90d += item.retention90d;
      return acc;
    },
    { views: 0, clicks: 0, applications: 0, screeningPass: 0, interviews: 0, offers: 0, hires: 0, retention30d: 0, retention90d: 0 }
  );

  const stageValues = [
    totals.views, totals.clicks, totals.applications, totals.screeningPass,
    totals.interviews, totals.offers, totals.hires, totals.retention30d, totals.retention90d,
  ];

  const stageRates = stageValues.map((v, i) => {
    if (i === 0) return 100;
    const prev = stageValues[i - 1];
    return prev > 0 ? Math.round((v / prev) * 10000) / 100 : 0;
  });

  const overallConversion = totals.views > 0
    ? Math.round((totals.hires / totals.views) * 10000) / 100
    : 0;

  const periodScores = data.map(d => ({
    period: d.period,
    score: d.hires + d.retention30d * 0.5 + d.retention90d * 0.3,
  }));
  periodScores.sort((a, b) => b.score - a.score);
  const bestPeriod = periodScores[0]?.period || data[0]?.period || '-';

  return { stageNames, stageValues, stageRates, overallConversion, bestPeriod };
}

export function calculateRetentionCohorts(
  data: RetentionAnalysis[],
  options?: {
    channels?: string[];
    townships?: string[];
    positionTypes?: string[];
  }
): {
  labels: string[];
  cohorts: Array<{
    name: string;
    size: number;
    rates: number[];
  }>;
  overallRates: number[];
  avgRetention30d: number;
  avgRetention90d: number;
  avgRetention180d: number;
} {
  let filtered = [...data];

  if (options?.channels?.length) {
    filtered = filtered.filter(d => options.channels!.includes(d.channel));
  }
  if (options?.townships?.length) {
    filtered = filtered.filter(d => options.townships!.includes(d.township));
  }
  if (options?.positionTypes?.length) {
    filtered = filtered.filter(d => options.positionTypes!.includes(d.positionType));
  }

  const maxMonths = Math.max(...filtered.map(d => d.months.length), 12);
  const labels = Array.from({ length: maxMonths }, (_, i) => `第${i + 1}月`);

  const cohorts = filtered.map(cohort => {
    const rates = Array.from({ length: maxMonths }, (_, i) => {
      const m = cohort.months[i];
      return m ? Math.round((m.remaining / cohort.cohortSize) * 10000) / 100 : 0;
    });
    return {
      name: cohort.cohort,
      size: cohort.cohortSize,
      rates,
    };
  });

  const overallRates = Array.from({ length: maxMonths }, (_, monthIdx) => {
    let totalSize = 0;
    let totalRemaining = 0;
    filtered.forEach(cohort => {
      const m = cohort.months[monthIdx];
      if (m) {
        totalSize += cohort.cohortSize;
        totalRemaining += m.remaining;
      }
    });
    return totalSize > 0 ? Math.round((totalRemaining / totalSize) * 10000) / 100 : 0;
  });

  const idx30 = 0;
  const idx90 = 2;
  const idx180 = 5;

  return {
    labels,
    cohorts,
    overallRates,
    avgRetention30d: overallRates[idx30] || 0,
    avgRetention90d: overallRates[idx90] || 0,
    avgRetention180d: overallRates[idx180] || 0,
  };
}

export function calculateAttritionReasons(
  data: RetentionAnalysis[]
): Array<{ reason: string; count: number; percentage: number }> {
  const reasonCount = new Map<string, number>();
  let totalAttritions = 0;

  data.forEach(cohort => {
    let prevRemaining = cohort.cohortSize;
    cohort.months.forEach(m => {
      const attrition = prevRemaining - m.remaining;
      if (attrition > 0 && m.attritionReason) {
        totalAttritions += attrition;
        reasonCount.set(
          m.attritionReason,
          (reasonCount.get(m.attritionReason) || 0) + attrition
        );
      }
      prevRemaining = m.remaining;
    });
  });

  const result = Array.from(reasonCount.entries()).map(([reason, count]) => ({
    reason,
    count,
    percentage: totalAttritions > 0 ? Math.round((count / totalAttritions) * 10000) / 100 : 0,
  }));

  return result.sort((a, b) => b.count - a.count);
}

export function calculateCostPerHireTrend(
  data: ChannelROI[]
): Array<{ month: string; cpa: number; hires: number; cost: number }> {
  const monthlyMap = new Map<string, { cost: number; hires: number }>();

  data.forEach(item => {
    const existing = monthlyMap.get(item.month) || { cost: 0, hires: 0 };
    existing.cost += item.cost;
    existing.hires += item.hires;
    monthlyMap.set(item.month, existing);
  });

  const months = Array.from(monthlyMap.keys()).sort();
  return months.map(month => {
    const { cost, hires } = monthlyMap.get(month)!;
    return {
      month,
      cpa: hires > 0 ? Math.round(cost / hires) : cost,
      hires,
      cost,
    };
  });
}

export function calculateTownshipRecruitmentHeatmap(
  townshipJobs: Array<{ code: string; name: string; jobs: number; enterprises: number; applications: number; hires: number }>
) {
  const maxJobs = Math.max(...townshipJobs.map(t => t.jobs), 1);
  const maxHires = Math.max(...townshipJobs.map(t => t.hires), 1);

  return townshipJobs.map(t => ({
    ...t,
    jobHeat: Math.round((t.jobs / maxJobs) * 100),
    hireHeat: Math.round((t.hires / maxHires) * 100),
    overallHeat: Math.round(
      (t.jobs / maxJobs) * 40 +
      (t.hires / maxHires) * 40 +
      (t.enterprises / Math.max(...townshipJobs.map(x => x.enterprises), 1)) * 20
    ),
    efficiency: t.jobs > 0 ? Math.round((t.hires / t.jobs) * 10000) / 100 : 0,
  })).sort((a, b) => b.overallHeat - a.overallHeat);
}

export function calculateInterviewConversionRates(
  funnelData: FunnelMetrics[]
): {
  screeningToInterview: number;
  interviewToOffer: number;
  offerToHire: number;
  overall: number;
} {
  const totals = funnelData.reduce(
    (acc, d) => {
      acc.screening += d.screeningPass;
      acc.interviews += d.interviews;
      acc.offers += d.offers;
      acc.hires += d.hires;
      return acc;
    },
    { screening: 0, interviews: 0, offers: 0, hires: 0 }
  );

  return {
    screeningToInterview: totals.screening > 0 ? Math.round((totals.interviews / totals.screening) * 10000) / 100 : 0,
    interviewToOffer: totals.interviews > 0 ? Math.round((totals.offers / totals.interviews) * 10000) / 100 : 0,
    offerToHire: totals.offers > 0 ? Math.round((totals.hires / totals.offers) * 10000) / 100 : 0,
    overall: totals.screening > 0 ? Math.round((totals.hires / totals.screening) * 10000) / 100 : 0,
  };
}
