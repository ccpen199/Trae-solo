import { Router } from 'express'

const router = Router()

const monitorCache = new Map<string, any[]>()

function generateMonitorData(hours: number) {
  const data = []
  const now = new Date()
  let lat = 22.5431
  let lng = 113.9545
  const targetLat = 39.9087
  const targetLng = 116.4571

  for (let i = hours; i >= 0; i--) {
    const progress = 1 - i / hours
    lat = 22.5431 + (targetLat - 22.5431) * progress + (Math.random() - 0.5) * 0.02
    lng = 113.9545 + (targetLng - 113.9545) * progress + (Math.random() - 0.5) * 0.02

    const hour = new Date(now.getTime() - i * 3600000).getHours()
    const isNight = hour < 6 || hour > 20
    const baseTemp = isNight ? 12 : 24
    const temp = baseTemp + (Math.random() - 0.5) * 6
    const humidity = 55 + (Math.random() - 0.5) * 12
    const vibration = i % 5 === 0 ? 2 + Math.random() * 4 : 0.5 + Math.random() * 1.5

    const ts = new Date(now.getTime() - i * 3600000)
    data.push({
      timestamp: ts.toISOString().replace('T', ' ').slice(0, 19),
      temperature: Number(temp.toFixed(1)),
      humidity: Number(humidity.toFixed(1)),
      vibration: Number(vibration.toFixed(2)),
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      speed: Number((Math.random() * 60 + 30).toFixed(0)),
      location: progress < 0.2 ? '广东省境内' : progress < 0.5 ? '湖南省境内' : progress < 0.8 ? '河南省境内' : '河北省境内'
    })
  }
  return data
}

const alertsStore: Record<string, any[]> = {
  'DB2026061100001': [
    { id: 'alert001', waybillNo: 'DB2026061100001', type: 'temperature', level: 'warning', value: 38.5, threshold: 40, unit: '℃', timestamp: '2026-06-11 13:42:00', location: '河南省郑州市G4京港澳高速', message: '温度接近上限阈值，请关注制冷系统状态', acknowledged: false },
    { id: 'alert002', waybillNo: 'DB2026061100001', type: 'vibration', level: 'critical', value: 7.2, threshold: 5, unit: 'g', timestamp: '2026-06-11 10:18:00', location: '湖南省长沙市G5513长张高速', message: '震动加速度严重超标，疑似货物颠簸', acknowledged: true, acknowledgedBy: '调度员王芳', acknowledgedAt: '2026-06-11 11:05:00' }
  ]
}

router.get('/:waybillNo/monitor', (req, res) => {
  const { waybillNo } = req.params
  const startTime = req.query.startTime as string | undefined
  const endTime = req.query.endTime as string | undefined

  if (!monitorCache.has(waybillNo)) {
    monitorCache.set(waybillNo, generateMonitorData(24))
  }

  let data = monitorCache.get(waybillNo)!
  if (startTime && endTime) {
    data = data.filter(d => d.timestamp >= startTime && d.timestamp <= endTime)
  }

  const latest = data[data.length - 1]
  const waybillAlerts = alertsStore[waybillNo] || []

  const dynamicAlerts: any[] = []
  for (const d of data) {
    if (d.temperature > 40 || d.temperature < -5) {
      const key = `temp-${d.timestamp}`
      if (!waybillAlerts.find(a => a.type === 'temperature' && a.timestamp === d.timestamp)) {
        dynamicAlerts.push({
          id: `dyn-${key}`,
          waybillNo,
          type: 'temperature',
          level: d.temperature > 45 ? 'critical' : 'warning',
          value: d.temperature,
          threshold: d.temperature > 40 ? 40 : -5,
          unit: '℃',
          timestamp: d.timestamp,
          location: d.location,
          message: `温度${d.temperature > 40 ? '超上限' : '超下限'}：${d.temperature}℃`,
          acknowledged: false
        })
      }
    }
    if (d.humidity > 80 || d.humidity < 30) {
      const key = `hum-${d.timestamp}`
      if (!waybillAlerts.find(a => a.type === 'humidity' && a.timestamp === d.timestamp)) {
        dynamicAlerts.push({
          id: `dyn-${key}`,
          waybillNo,
          type: 'humidity',
          level: 'warning',
          value: d.humidity,
          threshold: d.humidity > 80 ? 80 : 30,
          unit: '%RH',
          timestamp: d.timestamp,
          location: d.location,
          message: `湿度异常：${d.humidity}%RH`,
          acknowledged: false
        })
      }
    }
    if (d.vibration > 5) {
      const key = `vib-${d.timestamp}`
      if (!waybillAlerts.find(a => a.type === 'vibration' && a.timestamp === d.timestamp)) {
        dynamicAlerts.push({
          id: `dyn-${key}`,
          waybillNo,
          type: 'vibration',
          level: d.vibration > 8 ? 'critical' : 'warning',
          value: d.vibration,
          threshold: 5,
          unit: 'g',
          timestamp: d.timestamp,
          location: d.location,
          message: `震动超标：${d.vibration}g`,
          acknowledged: false
        })
      }
    }
  }

  const allAlerts = [...waybillAlerts, ...dynamicAlerts]
  const uniqueAlerts = allAlerts.filter((a, i, arr) => arr.findIndex(b => b.timestamp === a.timestamp && b.type === a.type) === i)

  res.json({
    code: 200,
    data: {
      waybillNo,
      latest: latest ? { temperature: latest.temperature, humidity: latest.humidity, vibration: latest.vibration, speed: latest.speed, location: latest.location, latitude: latest.latitude, longitude: latest.longitude } : null,
      progress: 30 + Math.floor(Math.random() * 40),
      alerts: uniqueAlerts.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
      history: data
    }
  })
})

router.post('/:waybillNo/alerts/:alertId/acknowledge', (req, res) => {
  const { waybillNo, alertId } = req.params
  const { acknowledgedBy } = req.body || {}

  const alerts = alertsStore[waybillNo]
  if (alerts) {
    const alert = alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.acknowledgedBy = acknowledgedBy || '当前用户'
      alert.acknowledgedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
      return res.json({ code: 200, data: alert })
    }
  }

  res.json({ code: 200, data: { id: alertId, acknowledged: true, acknowledgedBy: acknowledgedBy || '当前用户', acknowledgedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) } })
})

export { router as trackingRouter }
