import { Router, type Request, type Response } from 'express'

const router = Router()

const BASE_PRICES: Record<string, { first: number; continue: number }> = {
  economy: { first: 12, continue: 4 },
  standard: { first: 18, continue: 6 },
  express: { first: 25, continue: 8 },
}

const ESTIMATED_DAYS: Record<string, { min: number; max: number }> = {
  economy: { min: 3, max: 5 },
  standard: { min: 2, max: 3 },
  express: { min: 1, max: 2 },
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calculateVolumeWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 6000
}

router.post('/calculate', (req: Request, res: Response): void => {
  const {
    weight,
    length = 0,
    width = 0,
    height = 0,
    service_type = 'standard',
    from_lat,
    from_lng,
    to_lat,
    to_lng,
    city_from,
    city_to,
    is_cod = false,
    cod_amount = 0,
    is_insured = false,
    insured_amount = 0,
  } = req.body

  if (!weight) {
    res.status(400).json({ success: false, error: '重量参数不能为空' })
    return
  }

  const priceConfig = BASE_PRICES[service_type as string] || BASE_PRICES.standard
  const daysConfig = ESTIMATED_DAYS[service_type as string] || ESTIMATED_DAYS.standard

  const volumeWeight = length > 0 && width > 0 && height > 0 ? calculateVolumeWeight(length, width, height) : 0
  const chargeWeight = Math.max(weight, volumeWeight)

  let baseFee = 0
  if (chargeWeight <= 1) {
    baseFee = priceConfig.first
  } else {
    baseFee = priceConfig.first + Math.ceil(chargeWeight - 1) * priceConfig.continue
  }

  let distanceFee = 0
  if (from_lat && from_lng && to_lat && to_lng) {
    const distance = calculateDistance(from_lat, from_lng, to_lat, to_lng)
    if (distance > 1000) {
      distanceFee = Math.ceil((distance - 1000) / 100) * 2
    }
  }

  let codFee = 0
  if (is_cod && cod_amount > 0) {
    codFee = Math.max(2, cod_amount * 0.01)
  }

  let insuredFee = 0
  if (is_insured && insured_amount > 0) {
    insuredFee = Math.max(2, insured_amount * 0.005)
  }

  const totalFee = Math.round((baseFee + distanceFee + codFee + insuredFee) * 100) / 100

  let estimatedDays = { ...daysConfig }
  if (city_from && city_to) {
    const sameProvince = city_from.slice(0, 2) === city_to.slice(0, 2)
    if (sameProvince) {
      estimatedDays = { min: Math.max(1, daysConfig.min - 1), max: daysConfig.max - 1 }
    }
  }

  res.json({
    success: true,
    data: {
      service_type,
      weight,
      volume_weight: Math.round(volumeWeight * 100) / 100,
      charge_weight: Math.round(chargeWeight * 100) / 100,
      base_fee: Math.round(baseFee * 100) / 100,
      distance_fee: Math.round(distanceFee * 100) / 100,
      cod_fee: Math.round(codFee * 100) / 100,
      insured_fee: Math.round(insuredFee * 100) / 100,
      total_fee: totalFee,
      estimated_days: estimatedDays,
    },
  })
})

router.get('/services', (req: Request, res: Response): void => {
  const services = [
    {
      type: 'economy',
      name: '经济件',
      description: '价格实惠，时效稍慢',
      first_weight_price: 12,
      continue_weight_price: 4,
      estimated_days: { min: 3, max: 5 },
      features: ['经济实惠', '适合时效要求不高的物品'],
    },
    {
      type: 'standard',
      name: '标准件',
      description: '性价比高，时效稳定',
      first_weight_price: 18,
      continue_weight_price: 6,
      estimated_days: { min: 2, max: 3 },
      features: ['时效稳定', '全程追踪', '性价比高'],
    },
    {
      type: 'express',
      name: '急件',
      description: '时效最快，优先派送',
      first_weight_price: 25,
      continue_weight_price: 8,
      estimated_days: { min: 1, max: 2 },
      features: ['优先处理', '空运直达', '快速派送'],
    },
  ]

  res.json({
    success: true,
    data: services,
  })
})

router.post('/quote', (req: Request, res: Response): void => {
  const {
    weight,
    length = 0,
    width = 0,
    height = 0,
    city_from,
    city_to,
    from_address,
    to_address,
  } = req.body

  if (!weight || !city_from || !city_to) {
    res.status(400).json({ success: false, error: '重量和寄达城市不能为空' })
    return
  }

  const types = ['economy', 'standard', 'express']
  const quotes = types.map(type => {
    const priceConfig = BASE_PRICES[type]
    const daysConfig = ESTIMATED_DAYS[type]
    const volumeWeight = length > 0 && width > 0 && height > 0 ? calculateVolumeWeight(length, width, height) : 0
    const chargeWeight = Math.max(weight, volumeWeight)

    let fee = 0
    if (chargeWeight <= 1) {
      fee = priceConfig.first
    } else {
      fee = priceConfig.first + Math.ceil(chargeWeight - 1) * priceConfig.continue
    }

    return {
      service_type: type,
      service_name: type === 'economy' ? '经济件' : type === 'standard' ? '标准件' : '急件',
      fee: Math.round(fee * 100) / 100,
      estimated_days: daysConfig,
    }
  })

  res.json({
    success: true,
    data: {
      from: city_from,
      to: city_to,
      weight,
      quotes,
    },
  })
})

export default router
