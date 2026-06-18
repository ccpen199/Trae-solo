import type { WeightConfig, DimensionScore, IndicatorScore } from '../../../shared/types.js';
import db from '../utils/database.js';

const defaultWeightConfigs: Record<string, WeightConfig> = {
  consumer: {
    category: 'consumer',
    dimensions: [
      { name: '产品品质', weight: 0.30, indicators: [{ code: 'consumer_quality', weight: 1.0 }] },
      { name: '性价比', weight: 0.25, indicators: [{ code: 'consumer_value', weight: 1.0 }] },
      {
        name: '口碑服务',
        weight: 0.35,
        indicators: [
          { code: 'consumer_reputation', weight: 0.57 },
          { code: 'consumer_service', weight: 0.43 },
        ],
      },
      { name: '合规性', weight: 0.10, indicators: [{ code: 'consumer_compliance', weight: 1.0 }] },
    ],
  },
  education: {
    category: 'education',
    dimensions: [
      {
        name: '教学实力',
        weight: 0.55,
        indicators: [
          { code: 'edu_teachers', weight: 0.55 },
          { code: 'edu_quality', weight: 0.45 },
        ],
      },
      { name: '学员口碑', weight: 0.20, indicators: [{ code: 'edu_satisfaction', weight: 1.0 }] },
      { name: '合规资质', weight: 0.15, indicators: [{ code: 'edu_license', weight: 1.0 }] },
      { name: '性价比', weight: 0.10, indicators: [{ code: 'edu_value', weight: 1.0 }] },
    ],
  },
  medical: {
    category: 'medical',
    dimensions: [
      {
        name: '资质安全',
        weight: 0.65,
        indicators: [
          { code: 'med_license', weight: 0.54 },
          { code: 'med_safety', weight: 0.46 },
        ],
      },
      {
        name: '服务效果',
        weight: 0.30,
        indicators: [
          { code: 'med_service', weight: 0.50 },
          { code: 'med_result', weight: 0.50 },
        ],
      },
      { name: '价格透明', weight: 0.05, indicators: [{ code: 'med_price', weight: 1.0 }] },
    ],
  },
  travel: {
    category: 'travel',
    dimensions: [
      { name: '景区品质', weight: 0.30, indicators: [{ code: 'travel_quality', weight: 1.0 }] },
      {
        name: '服务体验',
        weight: 0.45,
        indicators: [
          { code: 'travel_service', weight: 0.56 },
          { code: 'travel_experience', weight: 0.44 },
        ],
      },
      { name: '性价比', weight: 0.15, indicators: [{ code: 'travel_value', weight: 1.0 }] },
      { name: '交通便利', weight: 0.10, indicators: [{ code: 'travel_transport', weight: 1.0 }] },
    ],
  },
};

export function getWeightConfig(category: string): WeightConfig {
  try {
    const row = db
      .prepare('SELECT dimension_weights FROM weight_configs WHERE category = ?')
      .get(category) as { dimension_weights: string } | undefined;
    if (row) {
      return {
        category,
        dimensions: JSON.parse(row.dimension_weights).dimensions,
      };
    }
  } catch (e) {
    // fallback to default
  }
  return defaultWeightConfigs[category] || defaultWeightConfigs.consumer;
}

export function calculateWeightedScore(
  indicatorScores: IndicatorScore[],
  category: string
): { overallScore: number; dimensionScores: DimensionScore[] } {
  const config = getWeightConfig(category);
  const dimensionScores: DimensionScore[] = [];
  let overallScore = 0;

  const scoreMap = new Map<string, number>();
  indicatorScores.forEach((is) => {
    if (is.indicatorCode) {
      scoreMap.set(is.indicatorCode, is.score);
    }
  });

  for (const dimension of config.dimensions) {
    let dimScore = 0;
    for (const ind of dimension.indicators) {
      const s = scoreMap.get(ind.code) || 0;
      dimScore += s * ind.weight;
    }
    dimensionScores.push({
      dimension: dimension.name,
      score: Math.round(dimScore * 100) / 100,
      weight: dimension.weight,
    });
    overallScore += dimScore * dimension.weight;
  }

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    dimensionScores,
  };
}
