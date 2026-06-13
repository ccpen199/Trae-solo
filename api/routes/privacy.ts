import { Router, type Request, type Response } from 'express'

const router = Router()

let storageInfo = {
  total: 32,
  used: 18.4,
  videoCount: 142,
  snapshotCount: 89,
  encrypted: true,
}

let encryptionEnabled = true
let keyId = 'AES256-GCM-2024-001'

router.get('/storage', (_req: Request, res: Response) => {
  res.json(storageInfo)
})

router.get('/encryption', (_req: Request, res: Response) => {
  res.json({ enabled: encryptionEnabled, keyId })
})

router.put('/encryption', (req: Request, res: Response) => {
  const { enabled } = req.body
  if (typeof enabled === 'boolean') {
    encryptionEnabled = enabled
    storageInfo.encrypted = enabled
  }
  res.json({ success: true, enabled: encryptionEnabled, keyId })
})

router.post('/clear', (_req: Request, res: Response) => {
  const freed = Math.floor(Math.random() * 5 + 2)
  storageInfo.used = Math.round((storageInfo.used - freed) * 10) / 10
  storageInfo.videoCount = Math.max(0, storageInfo.videoCount - Math.floor(Math.random() * 15 + 5))
  storageInfo.snapshotCount = Math.max(0, storageInfo.snapshotCount - Math.floor(Math.random() * 10 + 3))
  res.json({ success: true, freed, storage: storageInfo })
})

export default router
