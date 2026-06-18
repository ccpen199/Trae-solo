import type { OverviewMetrics, HeatmapPoint, VisitorBehavior } from '@/types'

const scenicCoords: Record<string, { lat: number; lng: number }> = {
  'scenic-1': { lat: 39.9163, lng: 116.3972 },
  'scenic-2': { lat: 40.0362, lng: 94.8024 },
  'scenic-3': { lat: 34.3841, lng: 109.2785 },
}

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

  for (let i = 0; i < pointCount; i++) {
    const latOffset = (Math.random() - 0.5) * 0.008
    const lngOffset = (Math.random() - 0.5) * 0.008
    const isCenter = Math.random() < 0.3

    points.push({
      lat: coords.lat + latOffset,
      lng: coords.lng + lngOffset,
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

  const hasStay = ['poi_stay'].includes(etype)
  const coords = scenicCoords[scenicId]

  return {
    id: `beh-${Date.now()}-${randInt(1000, 9999)}`,
    scenicId,
    sessionId: `sess-${randInt(10000, 99999)}`,
    poiId: selectedPoi,
    eventType: etype,
    timestamp: dateStr,
    stayDuration: hasStay ? rand(0.5, 15) : undefined,
    location: coords ? { lat: coords.lat + (Math.random() - 0.5) * 0.005, lng: coords.lng + (Math.random() - 0.5) * 0.005 } : undefined,
    deviceType: deviceTypes[randInt(0, deviceTypes.length - 1)],
    webArSupported: Math.random() > 0.15,
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
