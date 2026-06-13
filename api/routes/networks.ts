import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { name, city, status, page = '1', pageSize = '20' } = req.query
  const pageNum = parseInt(page as string)
  const pageSizeNum = parseInt(pageSize as string)
  const offset = (pageNum - 1) * pageSizeNum

  let whereClauses: string[] = []
  let params: any[] = []

  if (name) {
    whereClauses.push('name LIKE ?')
    params.push(`%${name}%`)
  }
  if (city) {
    whereClauses.push('address LIKE ?')
    params.push(`%${city}%`)
  }
  if (status) {
    whereClauses.push('status = ?')
    params.push(status)
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM network_points ${whereSql}`)
  const total = totalStmt.get(...params) as { count: number }

  const stmt = db.prepare(`SELECT * FROM network_points ${whereSql} ORDER BY name LIMIT ? OFFSET ?`)
  const networks = stmt.all(...params, pageSizeNum, offset)

  const parsed = networks.map((n: any) => ({
    ...n,
    coverage_polygon: JSON.parse(n.coverage_polygon),
  }))

  res.json({
    success: true,
    data: {
      list: parsed,
      total: total.count,
      page: pageNum,
      pageSize: pageSizeNum,
    },
  })
})

router.get('/nearby', (req: Request, res: Response): void => {
  const { lat, lng, radius = '5' } = req.query

  if (!lat || !lng) {
    res.status(400).json({ success: false, error: '经纬度参数不能为空' })
    return
  }

  const latNum = parseFloat(lat as string)
  const lngNum = parseFloat(lng as string)
  const radiusNum = parseFloat(radius as string)

  const networks = db.prepare(`
    SELECT * FROM network_points WHERE status = 'active'
  `).all() as any[]

  function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const withDistance = networks
    .map(n => ({
      ...n,
      distance: calcDistance(latNum, lngNum, n.lat, n.lng),
    }))
    .filter(n => n.distance <= radiusNum)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20)

  const parsed = withDistance.map((n: any) => ({
    ...n,
    coverage_polygon: JSON.parse(n.coverage_polygon),
  }))

  res.json({
    success: true,
    data: parsed,
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const stmt = db.prepare('SELECT * FROM network_points WHERE id = ?')
  const network = stmt.get(id) as any

  if (!network) {
    res.status(404).json({ success: false, error: '网点不存在' })
    return
  }

  res.json({
    success: true,
    data: {
      ...network,
      coverage_polygon: JSON.parse(network.coverage_polygon),
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, address, phone, business_hours, lat, lng, service_radius = 3.0, coverage_polygon = [], status = 'active' } = req.body

  if (!name || !address || !phone || !lat || !lng) {
    res.status(400).json({ success: false, error: '必填参数不能为空' })
    return
  }

  const id = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO network_points (id, name, address, phone, business_hours, lat, lng, service_radius, coverage_polygon, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(id, name, address, phone, business_hours, lat, lng, service_radius, JSON.stringify(coverage_polygon), status)

  const newNetwork = db.prepare('SELECT * FROM network_points WHERE id = ?').get(id) as any
  res.status(201).json({
    success: true,
    data: {
      ...newNetwork,
      coverage_polygon: JSON.parse(newNetwork.coverage_polygon),
    },
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { name, address, phone, business_hours, lat, lng, service_radius, coverage_polygon, status } = req.body

  const networkStmt = db.prepare('SELECT * FROM network_points WHERE id = ?')
  const existing = networkStmt.get(id) as any

  if (!existing) {
    res.status(404).json({ success: false, error: '网点不存在' })
    return
  }

  const updateFields: string[] = []
  const updateParams: any[] = []

  if (name !== undefined) {
    updateFields.push('name = ?')
    updateParams.push(name)
  }
  if (address !== undefined) {
    updateFields.push('address = ?')
    updateParams.push(address)
  }
  if (phone !== undefined) {
    updateFields.push('phone = ?')
    updateParams.push(phone)
  }
  if (business_hours !== undefined) {
    updateFields.push('business_hours = ?')
    updateParams.push(business_hours)
  }
  if (lat !== undefined) {
    updateFields.push('lat = ?')
    updateParams.push(lat)
  }
  if (lng !== undefined) {
    updateFields.push('lng = ?')
    updateParams.push(lng)
  }
  if (service_radius !== undefined) {
    updateFields.push('service_radius = ?')
    updateParams.push(service_radius)
  }
  if (coverage_polygon !== undefined) {
    updateFields.push('coverage_polygon = ?')
    updateParams.push(JSON.stringify(coverage_polygon))
  }
  if (status !== undefined) {
    updateFields.push('status = ?')
    updateParams.push(status)
  }

  if (updateFields.length > 0) {
    updateParams.push(id)
    const stmt = db.prepare(`UPDATE network_points SET ${updateFields.join(', ')} WHERE id = ?`)
    stmt.run(...updateParams)
  }

  const updated = db.prepare('SELECT * FROM network_points WHERE id = ?').get(id) as any
  res.json({
    success: true,
    data: {
      ...updated,
      coverage_polygon: JSON.parse(updated.coverage_polygon),
    },
  })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const networkStmt = db.prepare('SELECT * FROM network_points WHERE id = ?')
  const existing = networkStmt.get(id)

  if (!existing) {
    res.status(404).json({ success: false, error: '网点不存在' })
    return
  }

  const stmt = db.prepare('DELETE FROM network_points WHERE id = ?')
  stmt.run(id)

  res.json({
    success: true,
    message: '网点已删除',
  })
})

export default router
