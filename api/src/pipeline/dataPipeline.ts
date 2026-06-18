import type {
  DataSource,
  IndicatorScore,
  EvaluationReport,
  EvaluationTarget,
  EvaluationIndicator,
} from '../../../shared/types.js';
import { calculateWeightedScore } from './weightCalculator.js';

type RawSource = {
  name: string;
  type: DataSource['type'];
  rawValue: number;
  unit: string;
};

const sourceTemplates: Record<string, { name: string; type: DataSource['type'] }[]> = {
  consumer: [
    { name: '天猫旗舰店销量', type: 'ecommerce' },
    { name: '京东好评率', type: 'ecommerce' },
    { name: '黑猫投诉解决率', type: 'complaint' },
    { name: '大众点评口碑分', type: 'review' },
    { name: '国家市场监管局抽检', type: 'sampling' },
  ],
  education: [
    { name: '学员续报率', type: 'ecommerce' },
    { name: '教育局办学许可', type: 'government' },
    { name: '黑猫投诉处理', type: 'complaint' },
    { name: '大众点评培训评价', type: 'review' },
    { name: '第三方满意度调查', type: 'sampling' },
  ],
  medical: [
    { name: '卫健委医疗机构许可证', type: 'government' },
    { name: '医师执业注册信息', type: 'government' },
    { name: '医疗纠纷投诉记录', type: 'complaint' },
    { name: '新氧医美口碑', type: 'review' },
    { name: '第三方术后抽样调查', type: 'sampling' },
  ],
  travel: [
    { name: '携程预订量', type: 'ecommerce' },
    { name: '文旅局景区评级', type: 'government' },
    { name: '12301旅游投诉', type: 'complaint' },
    { name: '马蜂窝游客评价', type: 'review' },
    { name: '景区客流抽样统计', type: 'sampling' },
  ],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

export function simulateDataCollection(targetId: number, category: string): RawSource[] {
  const templates = sourceTemplates[category] || sourceTemplates.consumer;
  return templates.map((t) => ({
    name: t.name,
    type: t.type,
    rawValue: randomFloat(60, 98),
    unit: '分',
  }));
}

export function normalizeData(rawData: RawSource[]): { normalized: number; sources: DataSource[] } {
  const now = new Date().toISOString();
  const sources: DataSource[] = rawData.map((r, idx) => ({
    id: `ds_${Date.now()}_${idx}`,
    indicatorScoreId: 0,
    name: r.name,
    type: r.type,
    collectedAt: now,
    rawValue: r.rawValue,
    normalizedValue: Math.round(Math.min(100, Math.max(0, r.rawValue)) * 100) / 100,
    verified: false,
  }));

  const avg = sources.reduce((s, x) => s + x.normalizedValue, 0) / sources.length;
  return { normalized: Math.round(avg * 100) / 100, sources };
}

export function crossValidate(sources: DataSource[]): DataSource[] {
  const values = sources.map((s) => s.normalizedValue);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return sources.map((s) => ({
    ...s,
    verified: Math.abs(s.normalizedValue - avg) <= stdDev * 1.5 + 5,
  }));
}

export function generateMockReport(
  targetId: number,
  reviewerId: number,
  category: string,
  target?: EvaluationTarget,
  indicators?: EvaluationIndicator[]
): EvaluationReport {
  const defaultIndicators = indicators || getDefaultIndicators(category);

  const indicatorScores: IndicatorScore[] = defaultIndicators.map((ind) => {
    const raw = simulateDataCollection(targetId, category);
    const { normalized, sources } = normalizeData(raw);
    const verifiedSources = crossValidate(sources);
    return {
      indicatorId: ind.id,
      indicatorName: ind.name,
      indicatorCode: ind.code,
      score: normalized,
      weight: ind.weight,
      dataSources: verifiedSources,
    };
  });

  const { overallScore, dimensionScores } = calculateWeightedScore(indicatorScores, category);

  const summaries: Record<string, (score: number) => string> = {
    consumer: (s) =>
      s >= 85
        ? '该消费品在品质、性价比和服务方面均表现优秀，消费者口碑良好，推荐购买。'
        : s >= 70
        ? '该消费品整体表现中规中矩，部分指标有待提升，建议关注售后服务。'
        : '该消费品存在较多问题，建议谨慎购买。',
    education: (s) =>
      s >= 85
        ? '该教育机构师资力量雄厚，教学质量优秀，学员满意度高，值得信赖。'
        : s >= 70
        ? '该教育机构整体表现尚可，建议重点考察师资和课程内容。'
        : '该教育机构存在明显不足，建议多方比较后再做决定。',
    medical: (s) =>
      s >= 85
        ? '该医美机构资质齐全合规，医疗安全有保障，服务效果良好，强烈推荐。'
        : s >= 70
        ? '该医美机构基本合规，建议关注医师资质和术后护理服务。'
        : '该医美机构存在合规风险，不建议选择。',
    travel: (s) =>
      s >= 85
        ? '该旅游目的地品质优秀，服务完善，游客体验良好，强烈推荐。'
        : s >= 70
        ? '该旅游目的地整体尚可，建议避开高峰期以获得更好体验。'
        : '该旅游目的地体验较差，建议谨慎选择。',
  };

  const targetName = target?.name || `评测对象 #${targetId}`;

  return {
    id: 0,
    targetId,
    reviewerId,
    title: `${targetName} 综合评测报告`,
    summary: (summaries[category] || summaries.consumer)(overallScore),
    overallScore,
    dimensionScores,
    indicatorScores,
    status: 'published',
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    target,
  };
}

function getDefaultIndicators(category: string): EvaluationIndicator[] {
  const indicatorMap: Record<string, EvaluationIndicator[]> = {
    consumer: [
      { id: 1, name: '产品质量', code: 'consumer_quality', weight: 0.30, category: 'consumer', description: '' },
      { id: 2, name: '性价比', code: 'consumer_value', weight: 0.25, category: 'consumer', description: '' },
      { id: 3, name: '品牌口碑', code: 'consumer_reputation', weight: 0.20, category: 'consumer', description: '' },
      { id: 4, name: '售后服务', code: 'consumer_service', weight: 0.15, category: 'consumer', description: '' },
      { id: 5, name: '合规性', code: 'consumer_compliance', weight: 0.10, category: 'consumer', description: '' },
    ],
    education: [
      { id: 6, name: '师资力量', code: 'edu_teachers', weight: 0.30, category: 'education', description: '' },
      { id: 7, name: '教学质量', code: 'edu_quality', weight: 0.25, category: 'education', description: '' },
      { id: 8, name: '学员满意度', code: 'edu_satisfaction', weight: 0.20, category: 'education', description: '' },
      { id: 9, name: '办学资质', code: 'edu_license', weight: 0.15, category: 'education', description: '' },
      { id: 10, name: '性价比', code: 'edu_value', weight: 0.10, category: 'education', description: '' },
    ],
    medical: [
      { id: 11, name: '资质合规性', code: 'med_license', weight: 0.35, category: 'medical', description: '' },
      { id: 12, name: '医疗安全', code: 'med_safety', weight: 0.30, category: 'medical', description: '' },
      { id: 13, name: '服务质量', code: 'med_service', weight: 0.15, category: 'medical', description: '' },
      { id: 14, name: '效果满意度', code: 'med_result', weight: 0.15, category: 'medical', description: '' },
      { id: 15, name: '价格透明度', code: 'med_price', weight: 0.05, category: 'medical', description: '' },
    ],
    travel: [
      { id: 16, name: '景区品质', code: 'travel_quality', weight: 0.30, category: 'travel', description: '' },
      { id: 17, name: '服务水平', code: 'travel_service', weight: 0.25, category: 'travel', description: '' },
      { id: 18, name: '游客体验', code: 'travel_experience', weight: 0.20, category: 'travel', description: '' },
      { id: 19, name: '性价比', code: 'travel_value', weight: 0.15, category: 'travel', description: '' },
      { id: 20, name: '交通便利性', code: 'travel_transport', weight: 0.10, category: 'travel', description: '' },
    ],
  };
  return indicatorMap[category] || indicatorMap.consumer;
}
