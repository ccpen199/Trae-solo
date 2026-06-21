import { Router, type Request, type Response } from 'express'
import authMiddleware from '../middleware/auth.js'
import { certificates, incrementUsageCount } from '../store/memory.js'
import type { Certificate } from '../../shared/types.js'

const router = Router()

router.get('/', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  incrementUsageCount(userId, 'certificates')

  const userCerts = certificates.get(userId) || certificates.get('demo-user') || []

  req.auditAction = 'get_certificates'
  req.auditModule = 'certificates'

  res.json({
    success: true,
    data: userCerts,
    total: userCerts.length,
  })
})

router.get('/:id/verify', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const { id } = req.params

  const userCerts = certificates.get(userId) || certificates.get('demo-user') || []
  const cert = userCerts.find((c: Certificate) => c.id === id)

  if (!cert) {
    res.status(404).json({ success: false, error: '证照不存在' })
    return
  }

  req.auditAction = 'verify_certificate'
  req.auditModule = 'certificates'

  res.json({
    success: true,
    data: {
      token: 'verify-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10),
      expireIn: 300,
      certId: cert.id,
      certTitle: cert.title,
      verifyTime: new Date().toISOString(),
    },
  })
})

export default router
