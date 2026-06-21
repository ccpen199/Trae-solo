import { Router, type Request, type Response } from 'express'
import authMiddleware from '../middleware/auth.js'
import { transportQr, transportRecords, incrementUsageCount } from '../store/memory.js'

const router = Router()

router.get('/qr', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'transport')

  let qr = transportQr.get(userId) || transportQr.get('demo-user')

  if (!qr) {
    qr = {
      token: 'transport-qr-' + Date.now(),
      expireIn: 60,
      balance: 100,
      type: '公交地铁通用码',
    }
  }

  req.auditAction = 'get_transport_qr'
  req.auditModule = 'transport'

  res.json({
    success: true,
    data: {
      ...qr,
      token: 'transport-qr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      generatedAt: new Date().toISOString(),
    },
  })
})

router.get('/records', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'transport')

  const { type, limit, offset } = req.query

  let records = transportRecords.get(userId) || transportRecords.get('demo-user') || []

  if (type) {
    records = records.filter((r) => r.type === type)
  }

  const limitNum = parseInt(limit as string, 10) || 20
  const offsetNum = parseInt(offset as string, 10) || 0
  const paginatedRecords = records.slice(offsetNum, offsetNum + limitNum)

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)

  req.auditAction = 'get_transport_records'
  req.auditModule = 'transport'

  res.json({
    success: true,
    data: paginatedRecords,
    total: records.length,
    summary: {
      totalTrips: records.length,
      totalAmount,
      thisMonthTrips: records.filter((r) => r.time.startsWith('2026-06')).length,
    },
  })
})

export default router
