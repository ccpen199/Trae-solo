import type { CargoItem, OrderCreateRequest, OrderQuoteResponse, PackagingOption, PackagingQuoteItem, AlertType, AlertLevel, AlertEvent } from '@/types'

export function calculateVolumeWeight(length: number, width: number, height: number): number {
  return Number(((length * width * height) / 6000).toFixed(2))
}

export function calculateChargeWeight(actualWeight: number, volumeWeight: number): number {
  return Math.max(actualWeight, volumeWeight)
}

export function isOversize(length: number, width: number, height: number): boolean {
  return Math.max(length, width, height) > 180
}

export function isOverweight(actualWeight: number): boolean {
  return actualWeight > 50
}

export function updateCargoWeights(cargo: Omit<CargoItem, 'volumeWeight' | 'chargeWeight'>): CargoItem {
  const volumeWeight = calculateVolumeWeight(cargo.length, cargo.width, cargo.height)
  const chargeWeight = calculateChargeWeight(cargo.actualWeight, volumeWeight)
  return {
    ...cargo,
    volumeWeight,
    chargeWeight,
    isOversize: isOversize(cargo.length, cargo.width, cargo.height),
    isOverweight: isOverweight(cargo.actualWeight)
  }
}

export function calculateFreightQuote(request: OrderCreateRequest): OrderQuoteResponse {
  const totalChargeWeight = request.cargoList.reduce((sum, c) => sum + c.chargeWeight * c.quantity, 0)
  const distance = 1200

  let baseFreight = totalChargeWeight * 2.5
  if (totalChargeWeight > 300) {
    baseFreight *= 1.15
  }

  const maxDimension = Math.max(...request.cargoList.flatMap(c => [c.length, c.width, c.height]))
  if (maxDimension > 300) {
    baseFreight *= 1.20
  }

  const pickupFee = request.services.pickup ? (totalChargeWeight > 500 ? 200 : 120) : 0
  const deliveryFee = request.services.delivery ? (totalChargeWeight > 500 ? 250 : 150) : 0
  const upstairsFee = request.services.upstairs ? 80 * 3 : 0

  let packagingFee = 0
  request.cargoList.forEach(c => {
    switch (c.packaging) {
      case 'wooden_box':
        packagingFee += (c.length * c.width * c.height / 1000000) * 280 * c.quantity
        break
      case 'wooden_pallet':
        packagingFee += 180 * c.quantity
        break
      case 'wooden_frame':
        packagingFee += 120 * c.quantity
        break
      case 'iron_frame':
        packagingFee += 350 * c.quantity
        break
      case 'plastic_pallet':
        packagingFee += 100 * c.quantity
        break
      default:
        packagingFee += 0
    }
  })

  const totalValue = request.cargoList.reduce((sum, c) => sum + c.value * c.quantity, 0)
  const insuranceFee = request.services.insurance ? totalValue * 0.003 : 0

  const temperatureFee = request.services.temperatureControl ? 800 : 0

  const overweightSurcharge = totalChargeWeight > 300 ? baseFreight * 0.15 : 0
  const oversizeSurcharge = maxDimension > 300 ? baseFreight * 0.20 : 0

  const total = Number((
    baseFreight + pickupFee + deliveryFee + upstairsFee + packagingFee +
    insuranceFee + temperatureFee + overweightSurcharge + oversizeSurcharge
  ).toFixed(2))

  const estimatedDays = Math.max(2, Math.round(distance / 500))

  return {
    baseFreight: Number(baseFreight.toFixed(2)),
    pickupFee: Number(pickupFee.toFixed(2)),
    deliveryFee: Number(deliveryFee.toFixed(2)),
    upstairsFee: Number(upstairsFee.toFixed(2)),
    packagingFee: Number(packagingFee.toFixed(2)),
    insuranceFee: Number(insuranceFee.toFixed(2)),
    temperatureFee: Number(temperatureFee.toFixed(2)),
    overweightSurcharge: Number(overweightSurcharge.toFixed(2)),
    oversizeSurcharge: Number(oversizeSurcharge.toFixed(2)),
    total,
    estimatedDays
  }
}

export const PACKAGING_OPTIONS: PackagingOption[] = [
  {
    type: 'wooden_box',
    name: '熏蒸木箱',
    description: '出口专用，符合IPPC标准，防水防潮',
    baseMaterialPrice: 280,
    laborPricePerHour: 150,
    fumigationFee: 200,
    reinforceFee: 100,
    unit: 'm³'
  },
  {
    type: 'wooden_box',
    name: '免熏蒸木箱',
    description: '国内运输及近洋运输使用',
    baseMaterialPrice: 220,
    laborPricePerHour: 120,
    fumigationFee: 0,
    reinforceFee: 80,
    unit: 'm³'
  },
  {
    type: 'wooden_pallet',
    name: '实木托盘',
    description: '承重1-3吨，适合叉车作业',
    baseMaterialPrice: 180,
    laborPricePerHour: 60,
    fumigationFee: 50,
    reinforceFee: 30,
    unit: '个'
  },
  {
    type: 'wooden_frame',
    name: '木框架包装',
    description: '机械设备专用，底部加固',
    baseMaterialPrice: 120,
    laborPricePerHour: 100,
    fumigationFee: 0,
    reinforceFee: 60,
    unit: '套'
  },
  {
    type: 'plastic_pallet',
    name: '塑料托盘',
    description: '防潮防锈，可重复使用',
    baseMaterialPrice: 100,
    laborPricePerHour: 40,
    fumigationFee: 0,
    reinforceFee: 0,
    unit: '个'
  },
  {
    type: 'iron_frame',
    name: '铁框架包装',
    description: '超重超精密设备专用',
    baseMaterialPrice: 350,
    laborPricePerHour: 200,
    fumigationFee: 0,
    reinforceFee: 150,
    unit: '套'
  }
]

export function calculatePackagingQuote(
  type: PackagingOption['type'],
  quantity: number,
  lengthCm = 0,
  widthCm = 0,
  heightCm = 0,
  needFumigation = false,
  needReinforce = false,
  name?: string
): PackagingQuoteItem {
  const option = name
    ? PACKAGING_OPTIONS.find(o => o.type === type && o.name === name) || PACKAGING_OPTIONS[0]
    : PACKAGING_OPTIONS.find(o => o.type === type) || PACKAGING_OPTIONS[0]

  let materialCost: number
  let specs: string

  if (type === 'wooden_box') {
    const volumeM3 = (lengthCm * widthCm * heightCm) / 1000000
    materialCost = option.baseMaterialPrice * Math.max(volumeM3, 0.1) * quantity
    specs = `${lengthCm}×${widthCm}×${heightCm}cm`
  } else {
    materialCost = option.baseMaterialPrice * quantity
    specs = option.name
  }

  const laborHours = type === 'wooden_box' ? Math.ceil(((lengthCm * widthCm * heightCm) / 1000000) * 2) + 1 : 0.5
  const laborCost = option.laborPricePerHour * laborHours * quantity
  const fumigationCost = needFumigation ? option.fumigationFee * quantity : 0
  const reinforceCost = needReinforce ? option.reinforceFee * quantity : 0
  const subtotal = Number((materialCost + laborCost + fumigationCost + reinforceCost).toFixed(2))

  return {
    type,
    name: option.name,
    specs,
    quantity,
    materialCost: Number(materialCost.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    fumigationCost: Number(fumigationCost.toFixed(2)),
    reinforceCost: Number(reinforceCost.toFixed(2)),
    subtotal
  }
}

export const THRESHOLD_CONFIG = {
  temperature: {
    standard: { min: 0, max: 40, warningMin: -5, warningMax: 45, unit: '℃' },
    coldChain: { min: 2, max: 8, warningMin: 0, warningMax: 10, unit: '℃' }
  },
  humidity: {
    standard: { min: 30, max: 80, warningMin: 20, warningMax: 90, unit: '%RH' },
    fragile: { min: 40, max: 60, warningMin: 30, warningMax: 70, unit: '%RH' }
  },
  vibration: {
    standard: { max: 5, warningMax: 8, unit: 'g' },
    precision: { max: 2, warningMax: 3, unit: 'g' }
  }
}

export function checkThreshold(
  type: AlertType,
  value: number,
  profile: 'standard' | 'coldChain' | 'fragile' | 'precision' = 'standard'
): { level: AlertLevel | null; message: string; threshold: number } {
  const config = THRESHOLD_CONFIG[type]
  if (!config) return { level: null, message: '', threshold: 0 }

  const prof = (config as any)[profile] || (config as any).standard
  let level: AlertLevel | null = null
  let message = ''
  let threshold = 0

  if (type === 'temperature' || type === 'humidity') {
    if (value < prof.min || value > prof.max) {
      level = 'critical'
      threshold = value < prof.min ? prof.min : prof.max
      message = `${type === 'temperature' ? '温度' : '湿度'}严重异常：${value}${prof.unit}，正常范围${prof.min}~${prof.max}${prof.unit}`
    } else if (value < prof.warningMin || value > prof.warningMax) {
      level = 'warning'
      threshold = value < prof.warningMin ? prof.warningMin : prof.warningMax
      message = `${type === 'temperature' ? '温度' : '湿度'}接近阈值：${value}${prof.unit}`
    }
  } else if (type === 'vibration') {
    if (value > prof.max) {
      level = 'critical'
      threshold = prof.max
      message = `震动严重超标：${value}${prof.unit}，阈值${prof.max}${prof.unit}`
    } else if (value > prof.warningMax) {
      level = 'warning'
      threshold = prof.warningMax
      message = `震动超标：${value}${prof.unit}，阈值${prof.warningMax}${prof.unit}`
    }
  }

  return { level, message, threshold }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(value)
}

export function formatWeight(value: number): string {
  return `${value.toFixed(2)} kg`
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}
