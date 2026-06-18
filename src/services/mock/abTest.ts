import type { ABTest } from '@/types'

let abTests: ABTest[] = [
  {
    id: 'ab-1',
    scenicId: 'scenic-1',
    name: '太和殿AR解说风格测试',
    description: '对比专业解说与故事化讲解两种AR内容呈现方式对游客停留时长的影响',
    variantA: '专业解说模式',
    variantB: '故事化讲解模式',
    status: 'running',
    startDate: '2024-06-01T00:00:00Z',
    metrics: {
      variantAImpressions: 4520,
      variantBImpressions: 4380,
      variantAConversions: 1356,
      variantBConversions: 1752,
      variantAConversionRate: 0.30,
      variantBConversionRate: 0.40,
    },
    createdAt: '2024-05-28T10:00:00Z',
  },
  {
    id: 'ab-2',
    scenicId: 'scenic-1',
    name: '导览路线推荐测试',
    description: '对比最短路线与深度体验路线对游客满意度的影响',
    variantA: '最短路线推荐',
    variantB: '深度体验路线推荐',
    status: 'completed',
    startDate: '2024-04-15T00:00:00Z',
    endDate: '2024-05-15T00:00:00Z',
    metrics: {
      variantAImpressions: 8200,
      variantBImpressions: 8100,
      variantAConversions: 4920,
      variantBConversions: 5670,
      variantAConversionRate: 0.60,
      variantBConversionRate: 0.70,
    },
    createdAt: '2024-04-10T09:00:00Z',
  },
  {
    id: 'ab-3',
    scenicId: 'scenic-2',
    name: '壁画还原AR效果测试',
    description: '对比渐变式还原与对比式还原两种AR呈现方式的用户参与度',
    variantA: '渐变式色彩还原',
    variantB: '古今对比式还原',
    status: 'running',
    startDate: '2024-07-01T00:00:00Z',
    metrics: {
      variantAImpressions: 2100,
      variantBImpressions: 2050,
      variantAConversions: 630,
      variantBConversions: 820,
      variantAConversionRate: 0.30,
      variantBConversionRate: 0.40,
    },
    createdAt: '2024-06-25T10:00:00Z',
  },
  {
    id: 'ab-4',
    scenicId: 'scenic-3',
    name: '兵马俑AR互动模式测试',
    description: '对比自由探索与引导式互动两种AR体验模式对游客参与时长的影响',
    variantA: '自由探索模式',
    variantB: '引导式互动模式',
    status: 'pending',
    startDate: '2024-08-01T00:00:00Z',
    metrics: {
      variantAImpressions: 0,
      variantBImpressions: 0,
      variantAConversions: 0,
      variantBConversions: 0,
      variantAConversionRate: 0,
      variantBConversionRate: 0,
    },
    createdAt: '2024-07-20T14:00:00Z',
  },
]

export function getABTests(scenicId?: string): ABTest[] {
  if (scenicId) {
    return abTests.filter((t) => t.scenicId === scenicId)
  }
  return abTests
}

export function createABTest(data: Omit<ABTest, 'id' | 'createdAt'>): ABTest {
  const newTest: ABTest = {
    ...data,
    id: `ab-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  abTests.push(newTest)
  return newTest
}

export function completeABTest(id: string): ABTest | undefined {
  const index = abTests.findIndex((t) => t.id === id)
  if (index === -1) return undefined
  abTests[index] = {
    ...abTests[index],
    status: 'completed',
    endDate: new Date().toISOString(),
  }
  return abTests[index]
}
