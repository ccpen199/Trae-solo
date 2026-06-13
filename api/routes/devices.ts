import { Router, type Request, type Response } from 'express'

const router = Router()

interface DeviceHealth {
  deviceId: string
  deviceName: string
  online: boolean
  signalStrength: number
  storageTotal: number
  storageUsed: number
  batteryLevel: number
  batteryHealth: number
  firmwareVersion: string
  lastSeen: string
}

const mockDevices: DeviceHealth[] = [
  {
    deviceId: 'doorbell-001',
    deviceName: '前门猫眼',
    online: true,
    signalStrength: -52,
    storageTotal: 32,
    storageUsed: 18.4,
    batteryLevel: 94,
    batteryHealth: 97,
    firmwareVersion: 'v2.4.1',
    lastSeen: new Date().toISOString(),
  },
  {
    deviceId: 'doorbell-002',
    deviceName: '后门猫眼',
    online: true,
    signalStrength: -67,
    storageTotal: 32,
    storageUsed: 12.1,
    batteryLevel: 87,
    batteryHealth: 93,
    firmwareVersion: 'v2.4.1',
    lastSeen: new Date(Date.now() - 60000).toISOString(),
  },
  {
    deviceId: 'doorbell-003',
    deviceName: '车库猫眼',
    online: false,
    signalStrength: -78,
    storageTotal: 16,
    storageUsed: 9.6,
    batteryLevel: 62,
    batteryHealth: 85,
    firmwareVersion: 'v2.3.8',
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
  },
]

router.get('/', (_req: Request, res: Response) => {
  res.json(mockDevices)
})

router.get('/:id', (req: Request, res: Response) => {
  const device = mockDevices.find((d) => d.deviceId === req.params.id)
  if (!device) {
    res.status(404).json({ error: 'Device not found' })
    return
  }
  res.json(device)
})

router.get('/:id/signal/history', (_req: Request, res: Response) => {
  const now = Date.now()
  const hours = 7 * 24
  const data = []
  for (let i = hours; i >= 0; i--) {
    const ts = now - i * 3600000
    const hour = new Date(ts).getHours()
    const dayBoost = hour >= 8 && hour <= 20 ? 8 : -5
    const noise = (Math.random() - 0.5) * 10
    const base = -68
    const value = Math.max(-90, Math.min(-45, Math.round(base + dayBoost + noise)))
    data.push({ timestamp: new Date(ts).toISOString(), value })
  }
  res.json(data)
})

router.get('/:id/battery/trend', (_req: Request, res: Response) => {
  const now = Date.now()
  const days = 30
  const data = []
  for (let i = days; i >= 0; i--) {
    const ts = now - i * 86400000
    const decline = (days - i) * 0.43
    const noise = (Math.random() - 0.5) * 1.2
    const capacity = Math.round((100 - decline + noise) * 10) / 10
    data.push({
      date: new Date(ts).toISOString().split('T')[0],
      capacity: Math.max(85, capacity),
    })
  }
  res.json(data)
})

export default router
