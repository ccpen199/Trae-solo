import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { getPendingVerifications } from '../services/counselorService.js'

const router = Router()

router.get('/crisis-alerts', (_req: Request, res: Response): void => {
  const profiles = db.prepare("SELECT * FROM profiles WHERE risk_level IN ('high', 'critical') ORDER BY created_at DESC").all() as any[]

  const ventRecords = db.prepare("SELECT * FROM vent_records WHERE risk_level IN ('high', 'critical') ORDER BY created_at DESC").all() as any[]

  res.json({
    success: true,
    data: {
      high_risk_profiles: profiles.map(p => ({
        ...p,
        life_event_tags: JSON.parse(p.life_event_tags),
      })),
      high_risk_vents: ventRecords.map(v => ({
        ...v,
        emotion_clustering: JSON.parse(v.emotion_clustering),
        keywords: JSON.parse(v.keywords),
      })),
    },
  })
})

router.get('/pending-verifications', (_req: Request, res: Response): void => {
  const counselors = getPendingVerifications()
  res.json({ success: true, data: counselors })
})

export default router
