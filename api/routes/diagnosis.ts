import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.post('/analyze', (req: Request, res: Response): void => {
  const { deviceId, symptoms } = req.body

  if (!deviceId || !symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    res.status(400).json({ success: false, error: '请提供设备ID和症状列表' })
    return
  }

  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as any
  if (!device) {
    res.status(404).json({ success: false, error: '设备不存在' })
    return
  }

  const rules = db.prepare('SELECT * FROM diagnosis_rules WHERE device_id = ?').all(deviceId) as any[]

  const results = rules
    .map((rule) => {
      const ruleSymptoms: string[] = JSON.parse(rule.symptoms)
      const matchCount = symptoms.filter((s: string) => ruleSymptoms.includes(s)).length
      const matchRatio = matchCount / ruleSymptoms.length
      const inputRatio = matchCount / symptoms.length
      const confidence = Math.round((matchRatio * 0.6 + inputRatio * 0.4) * rule.confidence * 100) / 100

      let requiredParts: { partId: string; partName: string; quantity: number }[] = []
      if (rule.required_parts) {
        try {
          requiredParts = JSON.parse(rule.required_parts)
        } catch { /* ignore */ }
      }

      return {
        faultId: rule.id,
        faultName: rule.fault_name,
        confidence: Math.min(confidence, 1),
        estimatedPrice: {
          min: rule.estimated_price_min,
          max: rule.estimated_price_max,
        },
        estimatedTime: rule.estimated_time,
        requiresParts: requiredParts,
      }
    })
    .filter((r) => r.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)

  res.json({
    success: true,
    data: {
      deviceId: device.id,
      deviceName: `${device.brand} ${device.model}`,
      results,
    },
  })
})

export default router
