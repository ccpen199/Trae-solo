import type { SupervisionData } from '@/types'

export const supervisionData: SupervisionData = {
  totalBatches: 156832,
  tracedBatches: 142315,
  traceRate: 90.7,
  passRate: 96.3,
  violationRate: 1.2,
  categoryStats: [
    { category: '蔬菜', count: 45280, passRate: 97.1 },
    { category: '水果', count: 38650, passRate: 96.8 },
    { category: '粮食', count: 32100, passRate: 98.2 },
    { category: '畜牧', count: 22430, passRate: 94.5 },
    { category: '水产', count: 18372, passRate: 93.7 },
    { category: '茶叶', count: 8650, passRate: 97.5 }
  ],
  regionStats: [
    { region: '山东省', count: 28500, passRate: 97.2 },
    { region: '黑龙江省', count: 22300, passRate: 98.0 },
    { region: '新疆维吾尔自治区', count: 19800, passRate: 96.5 },
    { region: '云南省', count: 15600, passRate: 95.8 },
    { region: '四川省', count: 14200, passRate: 96.1 },
    { region: '广东省', count: 12800, passRate: 94.3 },
    { region: '江苏省', count: 11500, passRate: 97.0 },
    { region: '河南省', count: 10800, passRate: 95.5 }
  ],
  trendData: [
    { month: '2025-07', passRate: 94.2, violationCount: 186 },
    { month: '2025-08', passRate: 94.5, violationCount: 172 },
    { month: '2025-09', passRate: 95.0, violationCount: 158 },
    { month: '2025-10', passRate: 95.3, violationCount: 145 },
    { month: '2025-11', passRate: 95.8, violationCount: 132 },
    { month: '2025-12', passRate: 96.0, violationCount: 125 },
    { month: '2026-01', passRate: 96.1, violationCount: 118 },
    { month: '2026-02', passRate: 96.0, violationCount: 122 },
    { month: '2026-03', passRate: 96.2, violationCount: 115 },
    { month: '2026-04', passRate: 96.3, violationCount: 108 },
    { month: '2026-05', passRate: 96.5, violationCount: 98 },
    { month: '2026-06', passRate: 96.3, violationCount: 105 }
  ]
}
