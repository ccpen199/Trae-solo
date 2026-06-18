import type { OverviewMetrics, HeatmapPoint, VisitorBehavior } from '@/types'

const scenicCoords: Record<string, { lat: number; lng: number }> = {
  'scenic-1': { lat: 39.9163, lng: 116.3972 },
  'scenic-2': { lat: 40.0362, lng: 94.8024 },
  'scenic-3': { lat: 34.3841, lng: 109.2785 },
}

const poiNameMap: Record<string, string> = {
  'poi-1-1': '太和殿',
  'poi-1-2': '中和殿',
  'poi-1-3': '保和殿',
  'poi-1-4': '乾清宫',
  'poi-1-5': '交泰殿',
  'poi-1-6': '坤宁宫',
  'poi-1-7': '御花园',
  'poi-1-8': '神武门',
  'poi-1-9': '午门',
  'poi-1-10': '文华殿',
  'poi-1-11': '武英殿',
  'poi-2-1': '第17窟',
  'poi-2-2': '第96窟',
  'poi-2-3': '第328窟',
  'poi-2-4': '藏经洞',
  'poi-2-5': '九层楼',
  'poi-2-6': '博物馆',
  'poi-2-7': '陈列中心',
  'poi-2-8': '石窟群',
  'poi-3-1': '兵马俑一号坑',
  'poi-3-2': '兵马俑二号坑',
  'poi-3-3': '兵马俑三号坑',
  'poi-3-4': '铜车马展厅',
  'poi-3-5': '秦始皇陵',
  'poi-3-6': '文物展厅',
  'poi-3-7': '环幕影院',
  'poi-3-8': 'K9901陪葬坑',
  'poi-3-9': 'K0006陪葬坑',
}

const shareChannels: NonNullable<VisitorBehavior['shareChannel']>[] = [
  'wechat_moments', 'wechat_friends', 'weibo', 'qq', 'link',
]

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

function generateVisitorTrend(): { date: string; count: number }[] {
  const trend: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    trend.push({
      date: d.toISOString().split('T')[0],
      count: randInt(8000, 45000),
    })
  }
  return trend
}

export function getOverviewMetrics(scenicId?: string): OverviewMetrics {
  const topScenics = [
    { id: 'scenic-1', name: '故宫博物院', visitors: 1980000 },
    { id: 'scenic-2', name: '敦煌莫高窟', visitors: 560000 },
    { id: 'scenic-3', name: '秦始皇兵马俑', visitors: 1250000 },
  ]

  const base: OverviewMetrics = {
    totalVisitors: 3790000,
    arLaunchCount: 1593900,
    avgStayDuration: 3.2,
    interactionRate: 0.38,
    visitorTrend: generateVisitorTrend(),
    topScenics,
  }

  if (!scenicId) return base

  const scenicData: Record<string, Partial<OverviewMetrics>> = {
    'scenic-1': { totalVisitors: 1980000, arLaunchCount: 831600, avgStayDuration: 3.5, interactionRate: 0.42 },
    'scenic-2': { totalVisitors: 560000, arLaunchCount: 324800, avgStayDuration: 4.2, interactionRate: 0.58 },
    'scenic-3': { totalVisitors: 1250000, arLaunchCount: 437500, avgStayDuration: 2.8, interactionRate: 0.35 },
  }

  const m = scenicData[scenicId]
  if (!m) return base

  return {
    totalVisitors: m.totalVisitors ?? base.totalVisitors,
    arLaunchCount: m.arLaunchCount ?? base.arLaunchCount,
    avgStayDuration: m.avgStayDuration ?? base.avgStayDuration,
    interactionRate: m.interactionRate ?? base.interactionRate,
    visitorTrend: generateVisitorTrend(),
    topScenics: topScenics.filter((s) => s.id === scenicId),
  }
}

export function getHeatmapData(scenicId: string, _date?: string): HeatmapPoint[] {
  const coords = scenicCoords[scenicId]
  if (!coords) return []

  const points: HeatmapPoint[] = []
  const pointCount = randInt(20, 40)
  const pois = poiIdsMap[scenicId] ?? []

  for (let i = 0; i < pointCount; i++) {
    const latOffset = (Math.random() - 0.5) * 0.008
    const lngOffset = (Math.random() - 0.5) * 0.008
    const isCenter = Math.random() < 0.3
    const usePoi = Math.random() < 0.5 && pois.length > 0
    const poiId = usePoi ? pois[randInt(0, pois.length - 1)] : undefined
    const latBase = usePoi && poiId ? coords.lat + ((parseInt(poiId.split('-')[2] ?? '0') - 2) * 0.001) : coords.lat
    const lngBase = usePoi && poiId ? coords.lng + ((parseInt(poiId.split('-')[2] ?? '0') - 2) * 0.0008) : coords.lng

    points.push({
      id: `hm-${i}-${scenicId}`,
      poiId,
      poiName: poiId ? poiNameMap[poiId] : undefined,
      lat: latBase + latOffset,
      lng: lngBase + lngOffset,
      intensity: isCenter ? rand(0.7, 1.0) : rand(0.1, 0.6),
    })
  }

  return points
}

const eventTypes: VisitorBehavior['eventType'][] = ['ar_launch', 'poi_enter', 'poi_stay', 'interaction_complete', 'share', 'audio_finish']
const deviceTypes: VisitorBehavior['deviceType'][] = ['ios', 'android', 'other']
const poiIdsMap: Record<string, string[]> = {
  'scenic-1': ['poi-1-1', 'poi-1-2', 'poi-1-3', 'poi-1-4'],
  'scenic-2': ['poi-2-1', 'poi-2-2', 'poi-2-3'],
  'scenic-3': ['poi-3-1', 'poi-3-2', 'poi-3-3', 'poi-3-4'],
}

function generateBehavior(scenicId: string, eventType?: VisitorBehavior['eventType']): VisitorBehavior {
  const etype = eventType ?? eventTypes[randInt(0, eventTypes.length - 1)]
  const hours = randInt(8, 17)
  const minutes = randInt(0, 59)
  const seconds = randInt(0, 59)
  const dateStr = `2024-07-${String(randInt(1, 28)).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}Z`

  const hasPoi = ['ar_launch', 'poi_enter', 'poi_stay', 'audio_finish'].includes(etype)
  const pois = poiIdsMap[scenicId] ?? []
  const selectedPoi = hasPoi && pois.length > 0 ? pois[randInt(0, pois.length - 1)] : undefined
  const selectedPoiName = selectedPoi ? poiNameMap[selectedPoi] : undefined

  const hasStay = ['poi_stay'].includes(etype)
  const coords = scenicCoords[scenicId]
  const hasShare = etype === 'share'
  const hasInteraction = ['interaction_complete'].includes(etype)
  const stayMin = hasStay ? rand(0.5, 15) : undefined
  const durationSec = stayMin ? Math.round(stayMin * 60) : undefined

  return {
    id: `beh-${Date.now()}-${randInt(1000, 9999)}`,
    scenicId,
    sessionId: `sess-${randInt(10000, 99999)}`,
    poiId: selectedPoi,
    poiName: selectedPoiName,
    eventType: etype,
    timestamp: dateStr,
    stayDuration: stayMin,
    duration: stayMin,
    durationSec,
    location: coords ? { lat: coords.lat + (Math.random() - 0.5) * 0.005, lng: coords.lng + (Math.random() - 0.5) * 0.005 } : undefined,
    deviceType: deviceTypes[randInt(0, deviceTypes.length - 1)],
    webArSupported: Math.random() > 0.15,
    shareChannel: hasShare ? shareChannels[randInt(0, shareChannels.length - 1)] : undefined,
    interactionCompleted: hasInteraction ? Math.random() > 0.25 : undefined,
    interactionType: hasInteraction ? ['quiz', 'hotspot', 'share'][randInt(0, 2)] : undefined,
  }
}

export function getVisitorBehaviors(scenicId?: string, eventType?: VisitorBehavior['eventType']): VisitorBehavior[] {
  const ids = scenicId ? [scenicId] : ['scenic-1', 'scenic-2', 'scenic-3']
  const count = randInt(15, 30)
  const behaviors: VisitorBehavior[] = []

  for (let i = 0; i < count; i++) {
    const sid = ids[randInt(0, ids.length - 1)]
    behaviors.push(generateBehavior(sid, eventType))
  }

  behaviors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return behaviors
}
