import { Router, type Request, type Response } from 'express'
import authMiddleware from '../middleware/auth.js'
import { socialAccounts, socialRecords, incrementUsageCount } from '../store/memory.js'
import type { PaymentRecord } from '../../shared/types.js'

const router = Router()

router.get('/account', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'social')

  const account = socialAccounts.get(userId) || socialAccounts.get('demo-user')

  req.auditAction = 'get_social_account'
  req.auditModule = 'social'

  res.json({
    success: true,
    data: account,
  })
})

router.get('/records', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const { type, start, end } = req.query

  let records = socialRecords.get(userId) || socialRecords.get('demo-user') || []

  if (type) {
    records = records.filter((r: PaymentRecord) => r.type === type)
  }
  if (start) {
    records = records.filter((r: PaymentRecord) => r.month >= start)
  }
  if (end) {
    records = records.filter((r: PaymentRecord) => r.month <= end)
  }

  req.auditAction = 'get_social_records'
  req.auditModule = 'social'

  res.json({
    success: true,
    data: records,
    total: records.length,
  })
})

router.get('/export', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'

  req.auditAction = 'export_social_records'
  req.auditModule = 'social'

  res.json({
    success: true,
    data: {
      pdfId: 'pdf-' + Date.now(),
      fileName: '社保公积金缴费明细.pdf',
      url: '/mock/social-export-demo.pdf',
      expireIn: 3600,
    },
  })
})

export default router
