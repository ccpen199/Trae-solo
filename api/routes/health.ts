import { Router, type Request, type Response } from 'express'
import authMiddleware from '../middleware/auth.js'
import { healthCodes, incrementUsageCount } from '../store/memory.js'
import type { HealthCode } from '../../shared/types.js'

const router = Router()

router.get('/code', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'health-code')

  let code = healthCodes.get(userId) || healthCodes.get('demo-user')

  if (!code) {
    code = {
      status: 'green',
      qrToken: 'health-qr-' + Date.now(),
      updatedAt: new Date().toISOString(),
      vaccine: { name: '新冠灭活疫苗', doses: 3, lastDate: '2023-02-15' },
      pcr: null,
    }
  }

  req.auditAction = 'get_health_code'
  req.auditModule = 'health'

  res.json({
    success: true,
    data: code,
  })
})

router.get('/refresh', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'

  const newCode: HealthCode = {
    status: 'green',
    qrToken: 'health-qr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    updatedAt: new Date().toISOString(),
    vaccine: { name: '新冠灭活疫苗', doses: 3, lastDate: '2023-02-15' },
    pcr: {
      result: 'negative',
      date: new Date().toISOString().split('T')[0],
      lab: '北京市社区检测中心',
    },
  }

  healthCodes.set(userId, newCode)

  req.auditAction = 'refresh_health_code'
  req.auditModule = 'health'

  res.json({
    success: true,
    data: newCode,
  })
})

export default router
