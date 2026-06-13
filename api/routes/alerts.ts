import { Router, type Request, type Response } from 'express'

const router = Router()

type AlertType = 'visitor' | 'family' | 'pet' | 'motion'

interface AlertEvent {
  id: string
  type: AlertType
  timestamp: string
  thumbnail: string
  confidence: number
  deviceId: string
  read: boolean
  description: string
}

const alertTypes: Array<{ type: AlertType; weight: number; descriptions: string[] }> = [
  {
    type: 'motion',
    weight: 40,
    descriptions: ['检测到门前移动', '走廊有人走动', '门口区域活动', '门前三米内移动检测'],
  },
  {
    type: 'visitor',
    weight: 35,
    descriptions: ['有访客按门铃', '陌生人出现在门前', '访客等待中', '新访客到达'],
  },
  {
    type: 'family',
    weight: 15,
    descriptions: ['家人回家', '家庭成员识别成功', '常驻人员归家'],
  },
  {
    type: 'pet',
    weight: 10,
    descriptions: ['检测到宠物活动', '小动物经过门前'],
  },
]

function pickWeightedType(): AlertType {
  const total = alertTypes.reduce((s, t) => s + t.weight, 0)
  let r = Math.random() * total
  for (const t of alertTypes) {
    r -= t.weight
    if (r <= 0) return t.type
  }
  return 'motion'
}

function generateAlerts(): AlertEvent[] {
  const count = 15 + Math.floor(Math.random() * 11)
  const alerts: AlertEvent[] = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const type = pickWeightedType()
    const info = alertTypes.find((t) => t.type === type)!
    const desc = info.descriptions[Math.floor(Math.random() * info.descriptions.length)]
    const offset = Math.floor(Math.random() * 86400000)
    alerts.push({
      id: `ALT-${String(i + 1).padStart(3, '0')}`,
      type,
      timestamp: new Date(now - offset).toISOString(),
      thumbnail: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=security%20camera%20${type}%20detection%20snapshot&image_size=square`,
      confidence: Math.round((0.75 + Math.random() * 0.24) * 100) / 100,
      deviceId: 'doorbell-001',
      read: Math.random() < 0.3,
      description: desc,
    })
  }
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

let cachedAlerts: AlertEvent[] | null = null

function getAlerts(): AlertEvent[] {
  if (!cachedAlerts) cachedAlerts = generateAlerts()
  return cachedAlerts
}

router.get('/', (_req: Request, res: Response) => {
  res.json(getAlerts())
})

router.get('/stats', (_req: Request, res: Response) => {
  const alerts = getAlerts()
  const byType: Record<AlertType, number> = { visitor: 0, family: 0, pet: 0, motion: 0 }
  for (const a of alerts) byType[a.type]++
  const byHour = Array.from({ length: 24 }, (_, h) => {
    const base = h >= 7 && h <= 21 ? 3 + Math.floor(Math.random() * 4) : Math.floor(Math.random() * 2)
    return base
  })
  const today = alerts.filter((a) => Date.now() - new Date(a.timestamp).getTime() < 86400000).length
  const week = alerts.length
  res.json({ today, week, byType, byHour })
})

router.put('/:id/read', (req: Request, res: Response) => {
  const alerts = getAlerts()
  const alert = alerts.find((a) => a.id === req.params.id)
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' })
    return
  }
  alert.read = true
  res.json({ success: true })
})

router.put('/read-all', (_req: Request, res: Response) => {
  for (const a of getAlerts()) a.read = true
  res.json({ success: true })
})

export default router
