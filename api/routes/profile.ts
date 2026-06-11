import { Router, type Request, type Response } from 'express'
import { createProfile, getProfile } from '../services/profileService.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { anonymous_name, phq9_score, gad7_score, life_event_tags, counseling_goals, risk_level } = req.body

  if (!anonymous_name) {
    res.status(400).json({ success: false, error: 'anonymous_name is required' })
    return
  }

  const profile = createProfile({
    anonymous_name,
    phq9_score,
    gad7_score,
    life_event_tags,
    counseling_goals,
    risk_level,
  })

  res.status(201).json({ success: true, data: profile })
})

router.get('/:id', (req: Request, res: Response): void => {
  const profile = getProfile(req.params.id)

  if (!profile) {
    res.status(404).json({ success: false, error: 'Profile not found' })
    return
  }

  res.json({ success: true, data: profile })
})

export default router
