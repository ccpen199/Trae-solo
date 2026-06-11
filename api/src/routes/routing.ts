import { Router } from 'express'

const router = Router()

interface Coordinate {
  lat: number
  lng: number
}

interface Restriction {
  id: string
  type: 'height_limit' | 'weight_limit' | 'restriction'
  value: number | string
  location: string
  lat: number
  lng: number
  description: string
}

interface RoutingPlan {
  id: string
  name: string
  type: 'recommended' | 'fastest' | 'economical'
  distance: number
  duration: number
  cost: number
  restrictions: Restriction[]
  coordinates: Coordinate[]
}

const plans: RoutingPlan[] = [
  {
    id: 'plan-001',
    name: '推荐路线',
    type: 'recommended',
    distance: 2156.5,
    duration: 26.5,
    cost: 12800,
    restrictions: [
      {
        id: 'rest-001',
        type: 'height_limit',
        value: 4.5,
        location: '湖北省武汉市G42沪蓉高速',
        lat: 30.5928,
        lng: 114.3055,
        description: '桥梁限高4.5米，请确认车辆高度'
      },
      {
        id: 'rest-002',
        type: 'weight_limit',
        value: 49,
        location: '河南省郑州市G4京港澳高速',
        lat: 34.7466,
        lng: 113.6254,
        description: '路段限重49吨，请确认车辆总重'
      }
    ],
    coordinates: [
      { lat: 22.5431, lng: 114.0579 },
      { lat: 23.1291, lng: 113.2644 },
      { lat: 28.2282, lng: 112.9388 },
      { lat: 30.5928, lng: 114.3055 },
      { lat: 34.7466, lng: 113.6254 },
      { lat: 39.9042, lng: 116.4074 }
    ]
  },
  {
    id: 'plan-002',
    name: '最快路线',
    type: 'fastest',
    distance: 2280.3,
    duration: 24.0,
    cost: 15600,
    restrictions: [
      {
        id: 'rest-003',
        type: 'restriction',
        value: '06:00-22:00',
        location: '上海市外环高速',
        lat: 31.2304,
        lng: 121.4737,
        description: '白天禁止大件车辆通行，建议夜间通行'
      },
      {
        id: 'rest-004',
        type: 'weight_limit',
        value: 55,
        location: '江苏省苏州市G15沈海高速',
        lat: 31.2990,
        lng: 120.5853,
        description: '桥梁限重55吨'
      }
    ],
    coordinates: [
      { lat: 22.5431, lng: 114.0579 },
      { lat: 25.0389, lng: 118.6853 },
      { lat: 28.6820, lng: 115.8579 },
      { lat: 31.2304, lng: 121.4737 },
      { lat: 34.2611, lng: 117.2864 },
      { lat: 39.9042, lng: 116.4074 }
    ]
  },
  {
    id: 'plan-003',
    name: '经济路线',
    type: 'economical',
    distance: 2410.8,
    duration: 32.0,
    cost: 9800,
    restrictions: [
      {
        id: 'rest-005',
        type: 'height_limit',
        value: 4.2,
        location: '湖南省长沙市G60沪昆高速',
        lat: 28.2282,
        lng: 112.9388,
        description: '隧道限高4.2米，请绕行'
      },
      {
        id: 'rest-006',
        type: 'restriction',
        value: '7:00-9:00,17:00-19:00',
        location: '湖北省武汉市三环线',
        lat: 30.5928,
        lng: 114.3055,
        description: '早晚高峰禁止大件车辆通行'
      },
      {
        id: 'rest-007',
        type: 'weight_limit',
        value: 40,
        location: '河南省洛阳市G30连霍高速',
        lat: 34.6658,
        lng: 112.4344,
        description: '旧桥限重40吨'
      }
    ],
    coordinates: [
      { lat: 22.5431, lng: 114.0579 },
      { lat: 25.0389, lng: 118.6853 },
      { lat: 28.2282, lng: 112.9388 },
      { lat: 30.5928, lng: 114.3055 },
      { lat: 34.6658, lng: 112.4344 },
      { lat: 39.9042, lng: 116.4074 }
    ]
  }
]

const allRestrictions: Restriction[] = [
  {
    id: 'rest-001',
    type: 'height_limit',
    value: 4.5,
    location: '湖北省武汉市G42沪蓉高速',
    lat: 30.5928,
    lng: 114.3055,
    description: '桥梁限高4.5米，请确认车辆高度'
  },
  {
    id: 'rest-002',
    type: 'weight_limit',
    value: 49,
    location: '河南省郑州市G4京港澳高速',
    lat: 34.7466,
    lng: 113.6254,
    description: '路段限重49吨，请确认车辆总重'
  },
  {
    id: 'rest-003',
    type: 'restriction',
    value: '06:00-22:00',
    location: '上海市外环高速',
    lat: 31.2304,
    lng: 121.4737,
    description: '白天禁止大件车辆通行，建议夜间通行'
  },
  {
    id: 'rest-004',
    type: 'weight_limit',
    value: 55,
    location: '江苏省苏州市G15沈海高速',
    lat: 31.2990,
    lng: 120.5853,
    description: '桥梁限重55吨'
  },
  {
    id: 'rest-005',
    type: 'height_limit',
    value: 4.2,
    location: '湖南省长沙市G60沪昆高速',
    lat: 28.2282,
    lng: 112.9388,
    description: '隧道限高4.2米，请绕行'
  },
  {
    id: 'rest-006',
    type: 'restriction',
    value: '7:00-9:00,17:00-19:00',
    location: '湖北省武汉市三环线',
    lat: 30.5928,
    lng: 114.3055,
    description: '早晚高峰禁止大件车辆通行'
  },
  {
    id: 'rest-007',
    type: 'weight_limit',
    value: 40,
    location: '河南省洛阳市G30连霍高速',
    lat: 34.6658,
    lng: 112.4344,
    description: '旧桥限重40吨'
  },
  {
    id: 'rest-008',
    type: 'height_limit',
    value: 4.0,
    location: '广东省广州市G1508绕城高速',
    lat: 23.1291,
    lng: 113.2644,
    description: '涵洞限高4.0米'
  },
  {
    id: 'rest-009',
    type: 'weight_limit',
    value: 30,
    location: '浙江省杭州市G25长深高速',
    lat: 30.2741,
    lng: 120.1551,
    description: '山区路段限重30吨'
  },
  {
    id: 'rest-010',
    type: 'restriction',
    value: '全天',
    location: '北京市五环路以内',
    lat: 39.9042,
    lng: 116.4074,
    description: '五环路以内全天禁止3吨以上货车通行，需办理通行证'
  }
]

const assignedPlans: Record<string, { assigned: boolean; assignedAt?: string; operator?: string }> = {}

router.get('/plans', (req, res) => {
  const { origin, destination, weight, volume, vehicleHeight, vehicleWeight } = req.query

  let filteredPlans = [...plans]

  if (vehicleHeight) {
    const height = parseFloat(vehicleHeight as string)
    filteredPlans = filteredPlans.map(plan => ({
      ...plan,
      restrictions: plan.restrictions.filter(r =>
        r.type !== 'height_limit' || (typeof r.value === 'number' && r.value >= height)
      )
    }))
  }

  if (vehicleWeight) {
    const vWeight = parseFloat(vehicleWeight as string)
    filteredPlans = filteredPlans.map(plan => ({
      ...plan,
      restrictions: plan.restrictions.filter(r =>
        r.type !== 'weight_limit' || (typeof r.value === 'number' && r.value >= vWeight)
      )
    }))
  }

  res.json({
    code: 200,
    data: {
      total: filteredPlans.length,
      origin: origin || '广东省深圳市',
      destination: destination || '北京市朝阳区',
      weight: weight ? parseFloat(weight as string) : null,
      volume: volume ? parseFloat(volume as string) : null,
      vehicleHeight: vehicleHeight ? parseFloat(vehicleHeight as string) : null,
      vehicleWeight: vehicleWeight ? parseFloat(vehicleWeight as string) : null,
      list: filteredPlans
    }
  })
})

router.post('/plans/:id/assign', (req, res) => {
  const { id } = req.params
  const { operator, remark } = req.body

  const plan = plans.find(p => p.id === id)
  if (!plan) {
    return res.status(404).json({ code: 404, message: '路线方案不存在' })
  }

  assignedPlans[id] = {
    assigned: true,
    assignedAt: new Date().toISOString(),
    operator: operator || '系统管理员'
  }

  res.json({
    code: 200,
    data: {
      planId: id,
      planName: plan.name,
      assigned: true,
      assignedAt: assignedPlans[id].assignedAt,
      operator: assignedPlans[id].operator,
      remark: remark || ''
    },
    message: '调度方案已下发成功'
  })
})

router.get('/restrictions', (_req, res) => {
  res.json({
    code: 200,
    data: {
      total: allRestrictions.length,
      heightLimits: allRestrictions.filter(r => r.type === 'height_limit').length,
      weightLimits: allRestrictions.filter(r => r.type === 'weight_limit').length,
      restrictions: allRestrictions.filter(r => r.type === 'restriction').length,
      list: allRestrictions
    }
  })
})

export { router as routingRouter }
