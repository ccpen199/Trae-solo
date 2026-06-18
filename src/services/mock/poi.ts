import type { POIPoint } from '@/types'

let pois: POIPoint[] = [
  {
    id: 'poi-1-1',
    scenicId: 'scenic-1',
    name: '太和殿',
    description: '太和殿俗称金銮殿，是明清两代北京城内最高的建筑，是皇帝举行盛大典礼的地方',
    lat: 39.9169,
    lng: 116.3976,
    triggerRadius: 30,
    arContentId: 'ar-1',
    order: 1,
  },
  {
    id: 'poi-1-2',
    scenicId: 'scenic-1',
    name: '中和殿',
    description: '中和殿是故宫三大殿之一，是皇帝去太和殿举行大典前稍事休息和演习礼仪的地方',
    lat: 39.9169,
    lng: 116.3981,
    triggerRadius: 20,
    arContentId: null,
    order: 2,
  },
  {
    id: 'poi-1-3',
    scenicId: 'scenic-1',
    name: '保和殿',
    description: '保和殿是故宫三大殿之一，清代在此举行殿试',
    lat: 39.9169,
    lng: 116.3986,
    triggerRadius: 25,
    arContentId: null,
    order: 3,
  },
  {
    id: 'poi-1-4',
    scenicId: 'scenic-1',
    name: '乾清宫',
    description: '乾清宫是内廷后三宫之首，明代十四个皇帝和清代两个皇帝以乾清宫为寝宫',
    lat: 39.9174,
    lng: 116.3976,
    triggerRadius: 25,
    arContentId: 'ar-2',
    order: 4,
  },
  {
    id: 'poi-2-1',
    scenicId: 'scenic-2',
    name: '第17窟',
    description: '第17窟为晚唐代表洞窟之一，窟内壁画内容丰富，色彩绚丽',
    lat: 40.0365,
    lng: 94.8021,
    triggerRadius: 15,
    arContentId: 'ar-3',
    order: 1,
  },
  {
    id: 'poi-2-2',
    scenicId: 'scenic-2',
    name: '第96窟',
    description: '第96窟内有莫高窟最高的大佛，高35.6米，是莫高窟的标志性建筑九层楼所在',
    lat: 40.0360,
    lng: 94.8027,
    triggerRadius: 20,
    arContentId: null,
    order: 2,
  },
  {
    id: 'poi-2-3',
    scenicId: 'scenic-2',
    name: '第328窟',
    description: '第328窟为初唐代表窟，窟内塑像保存完好，供养天女像极为精美',
    lat: 40.0367,
    lng: 94.8029,
    triggerRadius: 15,
    arContentId: 'ar-4',
    order: 3,
  },
  {
    id: 'poi-3-1',
    scenicId: 'scenic-3',
    name: '一号坑',
    description: '一号坑是兵马俑规模最大的坑，面积约14000平方米，排列着约6000个兵马俑',
    lat: 34.3845,
    lng: 109.2789,
    triggerRadius: 40,
    arContentId: 'ar-5',
    order: 1,
  },
  {
    id: 'poi-3-2',
    scenicId: 'scenic-3',
    name: '二号坑',
    description: '二号坑面积约6000平方米，是多兵种混合编组的曲尺形军阵',
    lat: 34.3842,
    lng: 109.2793,
    triggerRadius: 30,
    arContentId: null,
    order: 2,
  },
  {
    id: 'poi-3-3',
    scenicId: 'scenic-3',
    name: '三号坑',
    description: '三号坑面积约520平方米，是军事指挥部，出土有高级军吏俑',
    lat: 34.3839,
    lng: 109.2791,
    triggerRadius: 20,
    arContentId: null,
    order: 3,
  },
  {
    id: 'poi-3-4',
    scenicId: 'scenic-3',
    name: '铜车马展厅',
    description: '展厅陈列着两乘大型彩绘铜车马，被誉为青铜之冠',
    lat: 34.3837,
    lng: 109.2783,
    triggerRadius: 20,
    arContentId: 'ar-6',
    order: 4,
  },
]

export function getPOIs(scenicId: string): POIPoint[] {
  return pois.filter((p) => p.scenicId === scenicId).sort((a, b) => a.order - b.order)
}

export function createPOI(data: Omit<POIPoint, 'id'>): POIPoint {
  const newPoi: POIPoint = {
    ...data,
    id: `poi-${Date.now()}`,
  }
  pois.push(newPoi)
  return newPoi
}

export function updatePOI(id: string, data: Partial<POIPoint>): POIPoint | undefined {
  const index = pois.findIndex((p) => p.id === id)
  if (index === -1) return undefined
  pois[index] = { ...pois[index], ...data }
  return pois[index]
}

export function deletePOI(id: string): boolean {
  const index = pois.findIndex((p) => p.id === id)
  if (index === -1) return false
  pois.splice(index, 1)
  return true
}
