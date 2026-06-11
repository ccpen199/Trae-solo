import { Router } from 'express'

const router = Router()

const vehicles = [
  { plateNo: '粤B·A8888', vehicleType: '9.6m厢式货车', driverName: '刘强', driverPhone: '138****1111', maxWeight: 18, height: 4.0, length: 9.6, gpsDeviceId: 'GPS-SZ-00888', status: 'running', currentLocation: '河南省郑州市G4京港澳高速', currentSpeed: 72, lastUpdateTime: '2026-06-11 15:42:18', onlineStatus: 'online', transportPlatformConnected: true },
  { plateNo: '京A·F6666', vehicleType: '13m平板挂车', driverName: '陈刚', driverPhone: '139****2222', maxWeight: 32, height: 4.2, length: 13.0, gpsDeviceId: 'GPS-BJ-00666', status: 'idle', currentLocation: '北京市朝阳区德邦物流园', currentSpeed: 0, lastUpdateTime: '2026-06-11 15:30:00', onlineStatus: 'online', transportPlatformConnected: true },
  { plateNo: '沪B·D9999', vehicleType: '17.5m低平板', driverName: '赵磊', driverPhone: '137****3333', maxWeight: 40, height: 4.4, length: 17.5, gpsDeviceId: 'GPS-SH-00999', status: 'running', currentLocation: '江苏省苏州市G2京沪高速', currentSpeed: 65, lastUpdateTime: '2026-06-11 15:43:00', onlineStatus: 'online', transportPlatformConnected: true },
  { plateNo: '粤B·C5555', vehicleType: '冷藏车', driverName: '孙明', driverPhone: '136****4444', maxWeight: 15, height: 3.8, length: 7.6, gpsDeviceId: 'GPS-SZ-00555', status: 'offline', currentLocation: '', currentSpeed: 0, lastUpdateTime: '2026-06-11 13:40:00', onlineStatus: 'offline', transportPlatformConnected: false }
]

router.get('/', (req, res) => {
  const status = req.query.status as string | undefined
  let result = vehicles
  if (status) {
    result = vehicles.filter(v => v.status === status)
  }
  res.json({
    code: 200,
    data: {
      total: result.length,
      online: vehicles.filter(v => v.onlineStatus === 'online').length,
      offline: vehicles.filter(v => v.onlineStatus === 'offline').length,
      platformConnected: vehicles.filter(v => v.transportPlatformConnected).length,
      list: result
    }
  })
})

router.get('/platform-status', (_req, res) => {
  res.json({
    code: 200,
    data: {
      platformName: '交通运输部货运车辆动态监控平台',
      connected: true,
      connectedVehicles: vehicles.filter(v => v.transportPlatformConnected).length,
      totalVehicles: vehicles.length,
      dataDelay: '2s',
      lastSyncTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      apiEndpoint: 'https://monitor.mot.gov.cn/api/v1/freight-vehicles',
      syncInterval: 30
    }
  })
})

router.get('/:plateNo', (req, res) => {
  const vehicle = vehicles.find(v => v.plateNo === req.params.plateNo)
  if (vehicle) {
    return res.json({ code: 200, data: vehicle })
  }
  res.status(404).json({ code: 404, message: '车辆未找到' })
})

export { router as vehicleRouter }
