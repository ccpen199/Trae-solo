import { Router, type Request, type Response } from 'express'
import authMiddleware from '../middleware/auth.js'
import { recommendServices, getUsageCount, incrementUsageCount } from '../store/memory.js'
import type { RecommendService } from '../../shared/types.js'

const router = Router()

router.get('/services', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const { limit, category } = req.query

  incrementUsageCount(userId, 'recommend')

  let services: RecommendService[] = recommendServices.map((svc) => ({
    ...svc,
    usageCount: getUsageCount(userId, svc.category),
  }))

  services.sort((a, b) => b.usageCount - a.usageCount)

  if (category) {
    services = services.filter((s) => s.category === category)
  }

  const limitNum = parseInt(limit as string, 10) || services.length
  services = services.slice(0, limitNum)

  const hotServices = services.filter((s) => s.usageCount >= 5)
  const otherServices = services.filter((s) => s.usageCount < 5)

  req.auditAction = 'get_recommend_services'
  req.auditModule = 'recommend'

  res.json({
    success: true,
    data: {
      recommended: services,
      hot: hotServices,
      other: otherServices,
    },
  })
})

export default router
