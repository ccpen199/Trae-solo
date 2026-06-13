import { Router, type Request, type Response } from 'express'

const router = Router()

router.get('/night-vision', (_req: Request, res: Response) => {
  const now = Date.now()
  const rawEntries = [
    { id: 'NV-001', event: 'ir_on' as const, lightLevel: 2.3, exposureCompensation: 1.5, reason: '环境光照低于阈值' },
    { id: 'NV-002', event: 'exposure_adjust' as const, lightLevel: 1.8, exposureCompensation: 2.0, reason: '曝光不足自动补偿' },
    { id: 'NV-003', event: 'ir_off' as const, lightLevel: 45.6, exposureCompensation: 0.0, reason: '环境光照恢复正常' },
    { id: 'NV-004', event: 'ir_on' as const, lightLevel: 3.1, exposureCompensation: 1.2, reason: '夜间自动切换红外' },
    { id: 'NV-005', event: 'exposure_adjust' as const, lightLevel: 5.2, exposureCompensation: -0.5, reason: '强光源直射补偿' },
    { id: 'NV-006', event: 'ir_off' as const, lightLevel: 120.0, exposureCompensation: 0.0, reason: '清晨光线恢复' },
    { id: 'NV-007', event: 'ir_on' as const, lightLevel: 1.5, exposureCompensation: 2.5, reason: '极低光照环境' },
    { id: 'NV-008', event: 'exposure_adjust' as const, lightLevel: 8.7, exposureCompensation: 0.8, reason: '半暗环境微调' },
    { id: 'NV-009', event: 'ir_off' as const, lightLevel: 89.3, exposureCompensation: 0.0, reason: '走廊灯开启' },
    { id: 'NV-010', event: 'ir_on' as const, lightLevel: 0.8, exposureCompensation: 3.0, reason: '深夜自动红外' },
  ]
  const data = rawEntries.map((e, i) => ({
    ...e,
    timestamp: new Date(now - (rawEntries.length - i) * 7200000).toISOString(),
  }))
  res.json(data)
})

router.get('/calls', (_req: Request, res: Response) => {
  const now = Date.now()
  const records: Array<{
    id: string
    startTime: string
    duration: number
    direction: 'incoming' | 'outgoing'
    quality: number
    noiseReduction: boolean
    echoCancellation: boolean
  }> = [
    { id: 'CALL-001', startTime: new Date(now - 1800000).toISOString(), duration: 45, direction: 'incoming', quality: 4, noiseReduction: true, echoCancellation: true },
    { id: 'CALL-002', startTime: new Date(now - 5400000).toISOString(), duration: 120, direction: 'outgoing', quality: 5, noiseReduction: true, echoCancellation: true },
    { id: 'CALL-003', startTime: new Date(now - 10800000).toISOString(), duration: 30, direction: 'incoming', quality: 3, noiseReduction: true, echoCancellation: false },
    { id: 'CALL-004', startTime: new Date(now - 18000000).toISOString(), duration: 90, direction: 'outgoing', quality: 4, noiseReduction: false, echoCancellation: true },
    { id: 'CALL-005', startTime: new Date(now - 28800000).toISOString(), duration: 15, direction: 'incoming', quality: 2, noiseReduction: true, echoCancellation: true },
    { id: 'CALL-006', startTime: new Date(now - 43200000).toISOString(), duration: 60, direction: 'incoming', quality: 5, noiseReduction: true, echoCancellation: true },
    { id: 'CALL-007', startTime: new Date(now - 57600000).toISOString(), duration: 180, direction: 'outgoing', quality: 4, noiseReduction: true, echoCancellation: true },
  ]
  res.json(records)
})

export default router
