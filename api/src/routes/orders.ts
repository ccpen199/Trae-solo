import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

interface CargoInput {
  name: string
  length: number
  width: number
  height: number
  actualWeight: number
  quantity: number
  packaging: string
  value: number
}

interface OrderInput {
  partnerOrderNo?: string
  sender: Record<string, any>
  receiver: Record<string, any>
  cargoList: CargoInput[]
  services?: Record<string, boolean>
  pickupTime?: string
  remark?: string
}

function calculateVolumeWeight(l: number, w: number, h: number): number {
  return Number(((l * w * h) / 6000).toFixed(2))
}

function calculateChargeWeight(actual: number, volume: number): number {
  return Math.max(actual, volume)
}

function calculateOrderQuote(cargoList: CargoInput[], services: Record<string, boolean> = {}) {
  let totalChargeWeight = 0
  for (const c of cargoList) {
    const vw = calculateVolumeWeight(c.length, c.width, c.height)
    const cw = calculateChargeWeight(c.actualWeight, vw)
    totalChargeWeight += cw * c.quantity
  }

  let baseFreight = totalChargeWeight * 2.5
  if (totalChargeWeight > 300) baseFreight *= 1.15

  const maxDim = Math.max(...cargoList.flatMap(c => [c.length, c.width, c.height]))
  if (maxDim > 300) baseFreight *= 1.20

  const pickupFee = services.pickup ? (totalChargeWeight > 500 ? 200 : 120) : 0
  const deliveryFee = services.delivery ? (totalChargeWeight > 500 ? 250 : 150) : 0
  const upstairsFee = services.upstairs ? 80 * 3 : 0

  let packagingFee = 0
  for (const c of cargoList) {
    switch (c.packaging) {
      case 'wooden_box': packagingFee += (c.length * c.width * c.height / 1000000) * 280 * c.quantity; break
      case 'wooden_pallet': packagingFee += 180 * c.quantity; break
      case 'wooden_frame': packagingFee += 120 * c.quantity; break
      case 'iron_frame': packagingFee += 350 * c.quantity; break
      case 'plastic_pallet': packagingFee += 100 * c.quantity; break
    }
  }

  const totalValue = cargoList.reduce((s, c) => s + c.value * c.quantity, 0)
  const insuranceFee = services.insurance ? totalValue * 0.003 : 0
  const temperatureFee = services.temperatureControl ? 800 : 0
  const overweightSurcharge = totalChargeWeight > 300 ? baseFreight * 0.15 : 0
  const oversizeSurcharge = maxDim > 300 ? baseFreight * 0.20 : 0

  const total = Number((
    baseFreight + pickupFee + deliveryFee + upstairsFee + packagingFee +
    insuranceFee + temperatureFee + overweightSurcharge + oversizeSurcharge
  ).toFixed(2))

  const estimatedDays = 4

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

const orders: Record<string, any> = {}

router.post('/', (req, res) => {
  const input: OrderInput = req.body

  if (!input.sender || !input.receiver || !input.cargoList?.length) {
    return res.status(400).json({ code: 400, message: '缺少必要参数：sender, receiver, cargoList' })
  }

  for (const c of input.cargoList) {
    if (c.actualWeight < 50) {
      return res.status(400).json({ code: 400, message: `货物"${c.name}"实际重量${c.actualWeight}kg未达大件标准(≥50kg)，请使用标准物流渠道` })
    }
  }

  const now = new Date()
  const ts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('')
  const waybillNo = 'DB' + ts + String(Math.floor(Math.random() * 10000)).padStart(4, '0')

  const cargoList = input.cargoList.map(c => {
    const volumeWeight = calculateVolumeWeight(c.length, c.width, c.height)
    const chargeWeight = calculateChargeWeight(c.actualWeight, volumeWeight)
    return { ...c, volumeWeight, chargeWeight, isOversize: Math.max(c.length, c.width, c.height) > 180, isOverweight: c.actualWeight > 50 }
  })

  const quote = calculateOrderQuote(input.cargoList, input.services)

  const arrival = new Date(now)
  arrival.setDate(arrival.getDate() + quote.estimatedDays)

  const order = {
    waybillNo,
    partnerOrderNo: input.partnerOrderNo || null,
    sender: input.sender,
    receiver: input.receiver,
    cargoList,
    services: input.services || {},
    remark: input.remark || '',
    quote,
    estimatedArrival: arrival.toISOString().slice(0, 10),
    status: 'created',
    createdAt: now.toISOString()
  }

  orders[waybillNo] = order

  res.status(201).json({
    code: 201,
    message: 'success',
    data: {
      waybillNo,
      totalFreight: quote.total,
      estimatedDays: quote.estimatedDays,
      estimatedArrival: order.estimatedArrival,
      status: 'created',
      cargoList: cargoList.map(c => ({
        name: c.name,
        volumeWeight: c.volumeWeight,
        chargeWeight: c.chargeWeight,
        isOversize: c.isOversize,
        isOverweight: c.isOverweight
      }))
    }
  })
})

router.get('/:waybillNo', (req, res) => {
  const { waybillNo } = req.params
  const order = orders[waybillNo]

  if (order) {
    return res.json({ code: 200, data: order })
  }

  const statuses = ['created', 'picked_up', 'in_transit', 'delivering', 'delivered']
  const status = statuses[Math.floor(Math.random() * 3)]
  const progress = status === 'in_transit' ? 40 + Math.floor(Math.random() * 40) : status === 'delivered' ? 100 : 10

  res.json({
    code: 200,
    data: {
      waybillNo,
      status,
      currentLocation: status === 'in_transit' ? '河南省郑州市G4京港澳高速' : status === 'delivered' ? '北京市朝阳区' : '广东省深圳市',
      estimatedArrival: '2026-06-13 18:00:00',
      progress,
      sender: { name: '张伟', phone: '138****6688', address: '广东省深圳市南山区科技园' },
      receiver: { name: '李明', phone: '139****8899', address: '北京市朝阳区国贸大厦' },
      cargoList: [{ name: '精密数控机床', volumeWeight: 2112, chargeWeight: 2112, quantity: 1 }],
      quote: { total: 5280.00, estimatedDays: 4 }
    }
  })
})

router.get('/', (_req, res) => {
  const list = Object.values(orders).map((o: any) => ({
    waybillNo: o.waybillNo,
    status: o.status,
    totalFreight: o.quote?.total,
    createdAt: o.createdAt
  }))
  res.json({ code: 200, data: { total: list.length, list } })
})

export { router as orderRouter }
