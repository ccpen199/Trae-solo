import { Router, type Request, type Response } from 'express'

const router = Router()

interface SyncLog {
  id: string
  type: string
  status: string
  recordCount: number
  timestamp: string
  detail: string
}

const syncLogs: SyncLog[] = [
  { id: 'sync-001', type: 'full', status: 'completed', recordCount: 15280, timestamp: '2026-06-09 02:00:00', detail: '全量同步完成，涉及8个部门' },
  { id: 'sync-002', type: 'incremental', status: 'completed', recordCount: 342, timestamp: '2026-06-09 06:00:00', detail: '增量同步完成，更新342条记录' },
  { id: 'sync-003', type: 'incremental', status: 'completed', recordCount: 128, timestamp: '2026-06-09 10:00:00', detail: '增量同步完成，更新128条记录' },
  { id: 'sync-004', type: 'incremental', status: 'completed', recordCount: 89, timestamp: '2026-06-09 14:00:00', detail: '增量同步完成，更新89条记录' },
  { id: 'sync-005', type: 'full', status: 'completed', recordCount: 15310, timestamp: '2026-06-08 02:00:00', detail: '全量同步完成，涉及8个部门' },
  { id: 'sync-006', type: 'incremental', status: 'failed', recordCount: 0, timestamp: '2026-06-08 06:00:00', detail: '增量同步失败，省级接口超时' },
  { id: 'sync-007', type: 'incremental', status: 'completed', recordCount: 256, timestamp: '2026-06-08 10:00:00', detail: '增量同步完成（重试后成功），更新256条记录' },
  { id: 'sync-008', type: 'incremental', status: 'completed', recordCount: 195, timestamp: '2026-06-08 14:00:00', detail: '增量同步完成，更新195条记录' },
  { id: 'sync-009', type: 'full', status: 'completed', recordCount: 15050, timestamp: '2026-06-07 02:00:00', detail: '全量同步完成，涉及8个部门' },
  { id: 'sync-010', type: 'incremental', status: 'completed', recordCount: 412, timestamp: '2026-06-07 06:00:00', detail: '增量同步完成，更新412条记录' },
]

let lastSyncTime = '2026-06-09 14:00:00'
let relayStatus = 'connected'

router.get('/status', (_req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: {
        status: relayStatus,
        channel: '省级政务数据中继通道',
        provinceEndpoint: 'https://province.gov.cn/api/relay',
        lastSyncTime,
        nextSyncTime: '2026-06-09 18:00:00',
        syncInterval: '4h',
        totalSyncCount: syncLogs.filter((l) => l.status === 'completed').length,
        failedSyncCount: syncLogs.filter((l) => l.status === 'failed').length,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/sync', (_req: Request, res: Response): void => {
  try {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    const recordCount = Math.floor(Math.random() * 200) + 50

    const newLog: SyncLog = {
      id: `sync-${String(syncLogs.length + 1).padStart(3, '0')}`,
      type: 'manual',
      status: 'completed',
      recordCount,
      timestamp: now,
      detail: `手动触发同步完成，更新${recordCount}条记录`,
    }
    syncLogs.unshift(newLog)
    lastSyncTime = now

    res.json({
      success: true,
      data: {
        syncId: newLog.id,
        status: 'completed',
        recordCount,
        timestamp: now,
        message: '同步已成功触发',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/logs', (req: Request, res: Response): void => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50)
    const logs = syncLogs.slice(0, limit)

    res.json({
      success: true,
      data: {
        total: syncLogs.length,
        logs,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
