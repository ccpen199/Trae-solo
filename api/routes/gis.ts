import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

router.get('/service-stations', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const area = req.query.area as string

    const offset = (page - 1) * pageSize

    let whereClause = ''
    const params: Record<string, unknown> = {}

    if (area) {
      whereClause = 'WHERE address LIKE @area'
      params.area = `%${area}%`
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM service_stations ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT * FROM service_stations
      ${whereClause}
      ORDER BY name ASC
      LIMIT @limit OFFSET @offset
    `)
    const stations = listStmt.all({ ...params, limit: pageSize, offset }).map((item: { services: string }) => ({
      ...item,
      services: JSON.parse(item.services),
    }))

    res.json({
      success: true,
      data: {
        list: stations,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取服务网点失败',
    })
  }
})

router.get('/service-stations/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const stmt = db.prepare('SELECT * FROM service_stations WHERE id = ?')
    const station = stmt.get(id)

    if (!station) {
      res.status(404).json({
        success: false,
        error: '网点不存在',
      })
      return
    }

    const stationWithServices = {
      ...(station as Record<string, unknown>),
      services: JSON.parse((station as { services: string }).services),
    }

    res.json({
      success: true,
      data: stationWithServices,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取网点详情失败',
    })
  }
})

router.get('/service-stations/nearby', (req: Request, res: Response): void => {
  try {
    const lng = parseFloat(req.query.lng as string)
    const lat = parseFloat(req.query.lat as string)
    const radius = parseFloat(req.query.radius as string) || 5

    if (isNaN(lng) || isNaN(lat)) {
      res.status(400).json({
        success: false,
        error: '坐标参数无效',
      })
      return
    }

    const stmt = db.prepare('SELECT * FROM service_stations')
    const allStations = stmt.all() as Array<{
      id: string
      name: string
      address: string
      lng: number
      lat: number
      business_hours: string
      services: string
      current_queue: number
      phone: string
    }>

    const nearbyStations = allStations
      .map(station => ({
        ...station,
        services: JSON.parse(station.services),
        distance: Math.round(haversineDistance(lat, lng, station.lat, station.lng) * 1000) / 1000,
      }))
      .filter(station => station.distance <= radius)
      .sort((a, b) => a.distance - b.distance)

    res.json({
      success: true,
      data: {
        list: nearbyStations,
        total: nearbyStations.length,
        center: { lng, lat },
        radius,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '查询附近网点失败',
    })
  }
})

router.get('/grid-workers', (req: Request, res: Response): void => {
  try {
    const status = req.query.status as string
    const area = req.query.area as string

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (status) {
      whereClauses.push('status = @status')
      params.status = status
    }
    if (area) {
      whereClauses.push('area = @area')
      params.area = area
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const stmt = db.prepare(`
      SELECT * FROM grid_workers
      ${whereClause}
      ORDER BY area ASC, status ASC, name ASC
    `)
    const workers = stmt.all(params)

    res.json({
      success: true,
      data: workers,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取网格员列表失败',
    })
  }
})

router.get('/grid-workers/area/:area', (req: Request, res: Response): void => {
  try {
    const { area } = req.params

    const stmt = db.prepare(`
      SELECT * FROM grid_workers
      WHERE area = ?
      ORDER BY status ASC, active_orders ASC
    `)
    const workers = stmt.all(area)

    res.json({
      success: true,
      data: workers,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取片区网格员失败',
    })
  }
})

export default router
