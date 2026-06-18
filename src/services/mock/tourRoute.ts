import type { TourRoute } from '@/types'

let tourRoutes: TourRoute[] = [
  {
    id: 'route-1-1',
    scenicId: 'scenic-1',
    name: '中轴线经典游览',
    poiIds: ['poi-1-1', 'poi-1-2', 'poi-1-3'],
    estimatedDuration: 90,
    description: '沿故宫中轴线游览三大殿，感受皇家建筑的恢弘气势',
  },
  {
    id: 'route-1-2',
    scenicId: 'scenic-1',
    name: '深度文化体验',
    poiIds: ['poi-1-1', 'poi-1-2', 'poi-1-3', 'poi-1-4'],
    estimatedDuration: 180,
    description: '涵盖中轴线与内廷区域的深度游览路线，体验帝王生活空间',
  },
  {
    id: 'route-2-1',
    scenicId: 'scenic-2',
    name: '经典洞窟巡览',
    poiIds: ['poi-2-1', 'poi-2-2', 'poi-2-3'],
    estimatedDuration: 120,
    description: '游览莫高窟最具代表性的洞窟，领略千年壁画艺术',
  },
  {
    id: 'route-2-2',
    scenicId: 'scenic-2',
    name: '壁画艺术深度游',
    poiIds: ['poi-2-1', 'poi-2-3'],
    estimatedDuration: 150,
    description: '深入探索莫高窟壁画艺术，AR辅助解读壁画细节',
  },
  {
    id: 'route-3-1',
    scenicId: 'scenic-3',
    name: '兵马俑全览',
    poiIds: ['poi-3-1', 'poi-3-2', 'poi-3-3', 'poi-3-4'],
    estimatedDuration: 150,
    description: '全面参观三个坑道及铜车马展厅，了解秦代军事与工艺',
  },
  {
    id: 'route-3-2',
    scenicId: 'scenic-3',
    name: '军阵探秘',
    poiIds: ['poi-3-1', 'poi-3-4'],
    estimatedDuration: 90,
    description: '聚焦一号坑军阵与铜车马，AR增强体验秦代军事科技',
  },
]

export function getTourRoutes(scenicId: string): TourRoute[] {
  return tourRoutes.filter((r) => r.scenicId === scenicId)
}

export function updateTourRoute(id: string, data: Partial<TourRoute>): TourRoute | undefined {
  const index = tourRoutes.findIndex((r) => r.id === id)
  if (index === -1) return undefined
  tourRoutes[index] = { ...tourRoutes[index], ...data }
  return tourRoutes[index]
}
