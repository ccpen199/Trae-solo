import { Router, type Request, type Response } from 'express'
import { getEmotionTrend } from '../services/emotionService.js'

const router = Router()

router.get('/trend', (req: Request, res: Response): void => {
  const { profileId, range } = req.query

  if (!profileId || typeof profileId !== 'string') {
    res.status(400).json({ success: false, error: 'profileId query parameter is required' })
    return
  }

  let days = 30
  if (range && typeof range === 'string') {
    const match = range.match(/^(\d+)d$/)
    if (match) days = parseInt(match[1], 10)
  }

  const trend = getEmotionTrend(profileId, days)
  res.json({ success: true, data: trend })
})

export default router
