import { Router, type Request, type Response } from 'express'
import { analyzeVentText } from '../services/ventService.js'

const router = Router()

router.post('/analyze', (req: Request, res: Response): void => {
  const { profile_id, content } = req.body

  if (!profile_id || !content) {
    res.status(400).json({ success: false, error: 'profile_id and content are required' })
    return
  }

  const result = analyzeVentText(profile_id, content)

  res.status(201).json({ success: true, data: result })
})

export default router
