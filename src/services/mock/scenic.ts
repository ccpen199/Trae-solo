import type { ScenicArea } from '@/types'

let scenicAreas: ScenicArea[] = [
  {
    id: 'scenic-1',
    name: '故宫博物院',
    description: '北京故宫是中国明清两代的皇家宫殿，旧称紫禁城，是世界上现存规模最大、保存最为完整的木质结构古建筑之一',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Forbidden%20City%20palace%20aerial%20view%20golden%20roofs%20red%20walls&image_size=landscape_16_9',
    center: { lat: 39.9163, lng: 116.3972 },
    radius: 500,
    status: 'active',
    createdAt: '2024-01-15T08:00:00Z',
    visitorCount: 1980000,
    arLaunchCount: 831600,
    province: '北京市',
    city: '北京市',
    level: 'AAAAA',
    poiCount: 11,
    routeCount: 3,
    address: '北京市东城区景山前街4号',
    openTime: '08:30',
    closeTime: '17:00',
    ticketPrice: 60,
    rating: 4.9,
  },
  {
    id: 'scenic-2',
    name: '敦煌莫高窟',
    description: '莫高窟俗称千佛洞，坐落在河西走廊西端的敦煌，以精美的壁画和塑像闻名于世，是世界文化遗产',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dunhuang%20Mogao%20Caves%20desert%20cliff%20Buddhist%20cave&image_size=landscape_16_9',
    center: { lat: 40.0362, lng: 94.8024 },
    radius: 300,
    status: 'active',
    createdAt: '2024-02-20T10:00:00Z',
    visitorCount: 560000,
    arLaunchCount: 324800,
    province: '甘肃省',
    city: '酒泉市',
    level: 'AAAAA',
    poiCount: 8,
    routeCount: 2,
    address: '甘肃省酒泉市敦煌市东南25公里',
    openTime: '08:00',
    closeTime: '18:00',
    ticketPrice: 238,
    rating: 4.8,
  },
  {
    id: 'scenic-3',
    name: '秦始皇兵马俑',
    description: '秦始皇兵马俑博物馆是中国最大的古代军事博物馆，被誉为世界第八大奇迹，展示秦朝军队的壮观阵容',
    coverImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Terracotta%20Warriors%20army%20pit%20Xian&image_size=landscape_16_9',
    center: { lat: 34.3841, lng: 109.2785 },
    radius: 400,
    status: 'active',
    createdAt: '2024-03-10T09:00:00Z',
    visitorCount: 1250000,
    arLaunchCount: 437500,
    province: '陕西省',
    city: '西安市',
    level: 'AAAAA',
    poiCount: 9,
    routeCount: 2,
    address: '陕西省西安市临潼区秦陵北路',
    openTime: '08:30',
    closeTime: '18:00',
    ticketPrice: 150,
    rating: 4.8,
  },
]

export function getScenicAreas(): ScenicArea[] {
  return scenicAreas
}

export function getScenicArea(id: string): ScenicArea | undefined {
  return scenicAreas.find((s) => s.id === id)
}

export function createScenicArea(data: Omit<ScenicArea, 'id' | 'createdAt'>): ScenicArea {
  const newArea: ScenicArea = {
    ...data,
    id: `scenic-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  scenicAreas.push(newArea)
  return newArea
}

export function updateScenicArea(id: string, data: Partial<ScenicArea>): ScenicArea | undefined {
  const index = scenicAreas.findIndex((s) => s.id === id)
  if (index === -1) return undefined
  scenicAreas[index] = { ...scenicAreas[index], ...data }
  return scenicAreas[index]
}

export function deleteScenicArea(id: string): boolean {
  const index = scenicAreas.findIndex((s) => s.id === id)
  if (index === -1) return false
  scenicAreas.splice(index, 1)
  return true
}
