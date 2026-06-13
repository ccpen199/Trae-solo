import { Router, type Request, type Response } from 'express'

const router = Router()

let geofenceConfig = {
  enabled: true,
  homeAddress: '北京市朝阳区建国路88号',
  latitude: 39.9042,
  longitude: 116.4074,
  radius: 3000,
  enterAction: 'silent' as const,
  exitAction: 'notify' as const,
}

router.get('/', (_req: Request, res: Response) => {
  res.json(geofenceConfig)
})

router.put('/', (req: Request, res: Response) => {
  const { enabled, homeAddress, latitude, longitude, radius, enterAction, exitAction } = req.body
  if (enabled != null) geofenceConfig.enabled = Boolean(enabled)
  if (homeAddress != null) geofenceConfig.homeAddress = String(homeAddress)
  if (latitude != null) geofenceConfig.latitude = Number(latitude)
  if (longitude != null) geofenceConfig.longitude = Number(longitude)
  if (radius != null) geofenceConfig.radius = Number(radius)
  if (enterAction != null) geofenceConfig.enterAction = enterAction
  if (exitAction != null) geofenceConfig.exitAction = exitAction
  res.json({ success: true, config: geofenceConfig })
})

export default router
