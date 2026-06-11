import { Router, type Request, type Response } from 'express'
import { getCounselors, getCounselor, verifyCounselor, getTimeSlots, addTimeSlot } from '../services/counselorService.js'
import { matchCounselors } from '../services/matchService.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const counselors = getCounselors()
  res.json({ success: true, data: counselors })
})

router.get('/match', (req: Request, res: Response): void => {
  const { profileId } = req.query

  if (!profileId || typeof profileId !== 'string') {
    res.status(400).json({ success: false, error: 'profileId query parameter is required' })
    return
  }

  const results = matchCounselors(profileId)
  res.json({ success: true, data: results })
})

router.get('/:id/slots', (req: Request, res: Response): void => {
  const { id } = req.params
  const slots = getTimeSlots(id)
  res.json({ success: true, data: slots })
})

router.post('/:id/slots', (req: Request, res: Response): void => {
  const { id } = req.params
  const { slot_date, start_time, end_time } = req.body

  if (!slot_date || !start_time || !end_time) {
    res.status(400).json({ success: false, error: 'slot_date, start_time, and end_time are required' })
    return
  }

  const slot = addTimeSlot(id, slot_date, start_time, end_time)
  res.status(201).json({ success: true, data: slot })
})

router.post('/:id/verify', (req: Request, res: Response): void => {
  const { id } = req.params
  const { ocr_status, db_match_status } = req.body

  if (!ocr_status || !db_match_status) {
    res.status(400).json({ success: false, error: 'ocr_status and db_match_status are required' })
    return
  }

  const result = verifyCounselor(id, ocr_status, db_match_status)

  if (!result) {
    res.status(404).json({ success: false, error: 'Counselor not found' })
    return
  }

  res.json({ success: true, data: result })
})

export default router
