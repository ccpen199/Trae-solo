import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/institutions', (req: Request, res: Response): void => {
  const db = getDb()
  const { type, level, name, page = '1', pageSize = '10' } = req.query

  let sql = 'SELECT * FROM medical_institution WHERE 1=1'
  const params: string[] = []

  if (type) {
    sql += ' AND type = ?'
    params.push(type as string)
  }
  if (level) {
    sql += ' AND level = ?'
    params.push(level as string)
  }
  if (name) {
    sql += ' AND name LIKE ?'
    params.push(`%${name}%`)
  }

  const countSql = `SELECT COUNT(*) as count FROM (${sql})`
  const total = db.prepare(countSql).get(...params) as { count: number }

  const offset = (Number(page) - 1) * Number(pageSize)
  sql += ' ORDER BY rating DESC LIMIT ? OFFSET ?'
  params.push(String(Number(pageSize)), String(offset))

  const institutions = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      institutions
    }
  })
})

router.get('/institutions/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params

  const institution = db.prepare('SELECT * FROM medical_institution WHERE id = ?').get(id)
  if (!institution) {
    res.status(404).json({ success: false, error: '机构不存在' })
    return
  }

  res.json({
    success: true,
    data: institution
  })
})

router.get('/institutions/:id/departments', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params

  const institution = db.prepare('SELECT * FROM medical_institution WHERE id = ?').get(id)
  if (!institution) {
    res.status(404).json({ success: false, error: '机构不存在' })
    return
  }

  const departments = db.prepare('SELECT * FROM institution_department WHERE institution_id = ?').all(id)

  res.json({
    success: true,
    data: {
      institutionId: id,
      institutionName: (institution as any).name,
      departments
    }
  })
})

router.get('/institutions/:id/medicines', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params
  const { in_catalog, page = '1', pageSize = '10' } = req.query

  const institution = db.prepare('SELECT * FROM medical_institution WHERE id = ?').get(id)
  if (!institution) {
    res.status(404).json({ success: false, error: '机构不存在' })
    return
  }

  let sql = 'SELECT * FROM institution_medicine WHERE institution_id = ?'
  const params: string[] = [id]

  if (in_catalog !== undefined) {
    sql += ' AND in_catalog = ?'
    params.push(in_catalog as string)
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...params) as { count: number }

  const offset = (Number(page) - 1) * Number(pageSize)
  sql += ' LIMIT ? OFFSET ?'
  params.push(String(Number(pageSize)), String(offset))

  const medicines = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      institutionId: id,
      institutionName: (institution as any).name,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      medicines
    }
  })
})

router.get('/nearby', (req: Request, res: Response): void => {
  const db = getDb()
  const { longitude, latitude, radius = '5' } = req.query

  if (!longitude || !latitude) {
    res.status(400).json({ success: false, error: '缺少经纬度参数' })
    return
  }

  const lng = Number(longitude)
  const lat = Number(latitude)
  const r = Number(radius)

  const institutions = db.prepare('SELECT * FROM medical_institution').all() as any[]

  const nearby = institutions
    .map(inst => {
      const dist = Math.sqrt(Math.pow((inst.longitude - lng) * 111, 2) + Math.pow((inst.latitude - lat) * 111 * Math.cos(lat * Math.PI / 180), 2))
      return { ...inst, distance: Math.round(dist * 10) / 10 }
    })
    .filter(inst => inst.distance <= r)
    .sort((a, b) => a.distance - b.distance)

  res.json({
    success: true,
    data: {
      center: { longitude: lng, latitude: lat },
      radius: r,
      count: nearby.length,
      institutions: nearby
    }
  })
})

export default router
