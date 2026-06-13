import { Router, type Request, type Response } from 'express'

const router = Router()

let otaStatus = {
  currentVersion: 'v2.4.1',
  latestVersion: 'v2.5.0',
  upgradeProgress: 0,
  upgradeStatus: 'idle' as 'idle' | 'downloading' | 'verifying' | 'installing' | 'rebooting' | 'success' | 'failed',
  breakpoint: null as number | null,
  deltaSize: '12.8 MB',
  fullSize: '48.2 MB',
  releaseNotes: '1. 优化夜视模式切换速度\n2. 新增人形检测灵敏度调节\n3. 修复低电量提醒延迟问题\n4. 提升P2P连接稳定性',
  estimatedTime: 180,
}

const otaHistory = [
  { id: 'OTA-001', version: 'v2.4.1', timestamp: new Date(Date.now() - 15 * 86400000).toISOString(), status: 'success' as const, duration: 185, deltaSize: '11.2 MB' },
  { id: 'OTA-002', version: 'v2.3.8', timestamp: new Date(Date.now() - 45 * 86400000).toISOString(), status: 'success' as const, duration: 162, deltaSize: '9.6 MB' },
  { id: 'OTA-003', version: 'v2.3.5', timestamp: new Date(Date.now() - 90 * 86400000).toISOString(), status: 'failed' as const, duration: 45, deltaSize: '8.1 MB' },
]

let upgradeTimer: ReturnType<typeof setInterval> | null = null

function simulateUpgrade() {
  otaStatus.upgradeStatus = 'downloading'
  upgradeTimer = setInterval(() => {
    if (otaStatus.upgradeStatus === 'idle') return
    if (otaStatus.upgradeProgress >= 30 && otaStatus.upgradeStatus === 'downloading') {
      otaStatus.upgradeStatus = 'verifying'
    }
    if (otaStatus.upgradeProgress >= 50 && otaStatus.upgradeStatus === 'verifying') {
      otaStatus.upgradeStatus = 'installing'
    }
    if (otaStatus.upgradeProgress >= 85 && otaStatus.upgradeStatus === 'installing') {
      otaStatus.upgradeStatus = 'rebooting'
    }
    otaStatus.upgradeProgress = Math.min(100, otaStatus.upgradeProgress + Math.random() * 6)
    otaStatus.estimatedTime = Math.max(0, Math.round(otaStatus.estimatedTime - 3))
    if (otaStatus.upgradeProgress >= 100) {
      otaStatus.upgradeProgress = 100
      otaStatus.upgradeStatus = 'success'
      otaStatus.currentVersion = otaStatus.latestVersion
      otaStatus.breakpoint = null
      if (upgradeTimer) clearInterval(upgradeTimer)
    }
  }, 800)
}

router.get('/status', (_req: Request, res: Response) => {
  res.json(otaStatus)
})

router.post('/start', (_req: Request, res: Response) => {
  if (otaStatus.upgradeStatus !== 'idle') {
    res.status(400).json({ error: 'Upgrade already in progress' })
    return
  }
  otaStatus.upgradeProgress = 0
  otaStatus.breakpoint = null
  otaStatus.estimatedTime = 180
  simulateUpgrade()
  res.json({ success: true })
})

router.post('/pause', (_req: Request, res: Response) => {
  if (otaStatus.upgradeStatus === 'idle' || otaStatus.upgradeStatus === 'success' || otaStatus.upgradeStatus === 'failed') {
    res.status(400).json({ error: 'No active upgrade to pause' })
    return
  }
  otaStatus.breakpoint = Math.round(otaStatus.upgradeProgress)
  otaStatus.upgradeStatus = 'idle'
  if (upgradeTimer) clearInterval(upgradeTimer)
  res.json({ success: true, breakpoint: otaStatus.breakpoint })
})

router.post('/resume', (_req: Request, res: Response) => {
  if (otaStatus.breakpoint === null) {
    res.status(400).json({ error: 'No paused upgrade to resume' })
    return
  }
  simulateUpgrade()
  res.json({ success: true })
})

router.get('/history', (_req: Request, res: Response) => {
  res.json(otaHistory)
})

export default router
