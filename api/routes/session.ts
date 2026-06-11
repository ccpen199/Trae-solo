import { Router, type Request, type Response } from 'express'
import { createSession, getSessionHistory, generateSummary } from '../services/sessionService.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { profile_id, counselor_id, scheduled_at, duration } = req.body

  if (!profile_id || !counselor_id || !scheduled_at) {
    res.status(400).json({ success: false, error: 'profile_id, counselor_id, and scheduled_at are required' })
    return
  }

  const session = createSession(profile_id, counselor_id, scheduled_at, duration)

  res.status(201).json({ success: true, data: session })
})

router.get('/history', (req: Request, res: Response): void => {
  const { profileId } = req.query

  if (!profileId || typeof profileId !== 'string') {
    res.status(400).json({ success: false, error: 'profileId query parameter is required' })
    return
  }

  const history = getSessionHistory(profileId)
  res.json({ success: true, data: history })
})

router.post('/:id/summary', (req: Request, res: Response): void => {
  const { id } = req.params

  const summary = generateSummary(id)

  if (!summary) {
    res.status(404).json({ success: false, error: 'Session not found' })
    return
  }

  res.status(201).json({ success: true, data: summary })
})

export default router
