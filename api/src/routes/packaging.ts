import { Router } from 'express'

const router = Router()

const PACKAGING_OPTIONS = [
  { type: 'wooden_box', name: '熏蒸木箱', description: '出口专用，符合IPPC标准', baseMaterialPrice: 280, laborPricePerHour: 150, fumigationFee: 200, reinforceFee: 100, unit: 'm³' },
  { type: 'wooden_box', name: '免熏蒸木箱', description: '国内运输及近洋运输', baseMaterialPrice: 220, laborPricePerHour: 120, fumigationFee: 0, reinforceFee: 80, unit: 'm³' },
  { type: 'wooden_pallet', name: '实木托盘', description: '承重1-3吨', baseMaterialPrice: 180, laborPricePerHour: 60, fumigationFee: 50, reinforceFee: 30, unit: '个' },
  { type: 'wooden_frame', name: '木框架包装', description: '机械设备专用', baseMaterialPrice: 120, laborPricePerHour: 100, fumigationFee: 0, reinforceFee: 60, unit: '套' },
  { type: 'plastic_pallet', name: '塑料托盘', description: '防潮防锈', baseMaterialPrice: 100, laborPricePerHour: 40, fumigationFee: 0, reinforceFee: 0, unit: '个' },
  { type: 'iron_frame', name: '铁框架包装', description: '超重超精密设备', baseMaterialPrice: 350, laborPricePerHour: 200, fumigationFee: 0, reinforceFee: 150, unit: '套' }
]

router.get('/options', (_req, res) => {
  res.json({ code: 200, data: PACKAGING_OPTIONS })
})

router.post('/quote', (req, res) => {
  const { type, name, quantity = 1, lengthCm = 0, widthCm = 0, heightCm = 0, needFumigation = false, needReinforce = false } = req.body

  const option = name
    ? PACKAGING_OPTIONS.find(o => o.type === type && o.name === name)
    : PACKAGING_OPTIONS.find(o => o.type === type)

  if (!option) {
    return res.status(400).json({ code: 400, message: '未找到对应包装类型' })
  }

  let materialCost: number
  let specs: string
  if (type === 'wooden_box') {
    const vol = (lengthCm * widthCm * heightCm) / 1000000
    materialCost = option.baseMaterialPrice * Math.max(vol, 0.1) * quantity
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

  res.json({
    code: 200,
    data: {
      type, name: option.name, specs, quantity,
      materialCost: Number(materialCost.toFixed(2)),
      laborCost: Number(laborCost.toFixed(2)),
      fumigationCost: Number(fumigationCost.toFixed(2)),
      reinforceCost: Number(reinforceCost.toFixed(2)),
      subtotal
    }
  })
})

export { router as packagingRouter }
