import { Router, type Request, type Response } from 'express'
import db from '../lib/db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { status, search } = req.query
  let query = 'SELECT * FROM molds WHERE 1=1'
  const params: (string | number)[] = []

  if (status) {
    query += ' AND status = ?'
    params.push(status as string)
  }
  if (search) {
    query += ' AND (mold_number LIKE ? OR product_name LIKE ?)'
    params.push(`%${search}%`, `%${search}%`)
  }

  const molds = db.prepare(query).all(...params)
  res.json({ success: true, data: molds })
})

router.get('/:id', (req: Request, res: Response) => {
  const mold = db.prepare('SELECT * FROM molds WHERE id = ?').get(req.params.id)
  if (!mold) {
    return res.status(404).json({ success: false, error: '模具不存在' })
  }
  res.json({ success: true, data: mold })
})

router.post('/', (req: Request, res: Response) => {
  const {
    mold_number,
    product_name,
    cavity_count,
    total_life,
    storage_location,
    maintenance_cycle,
    responsible_person,
  } = req.body

  try {
    const result = db.prepare(`
      INSERT INTO molds (
        mold_number, product_name, cavity_count, total_life,
        storage_location, maintenance_cycle, responsible_person
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      mold_number,
      product_name,
      cavity_count || 1,
      total_life || 100000,
      storage_location,
      maintenance_cycle || 10000,
      responsible_person
    )

    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, error: '模号已存在' })
    }
    res.status(500).json({ success: false, error: '创建失败' })
  }
})

router.put('/:id', (req: Request, res: Response) => {
  const {
    product_name,
    cavity_count,
    total_life,
    storage_location,
    maintenance_cycle,
    responsible_person,
    status,
  } = req.body

  db.prepare(`
    UPDATE molds SET
      product_name = COALESCE(?, product_name),
      cavity_count = COALESCE(?, cavity_count),
      total_life = COALESCE(?, total_life),
      storage_location = COALESCE(?, storage_location),
      maintenance_cycle = COALESCE(?, maintenance_cycle),
      responsible_person = COALESCE(?, responsible_person),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    product_name,
    cavity_count,
    total_life,
    storage_location,
    maintenance_cycle,
    responsible_person,
    status,
    req.params.id
  )

  res.json({ success: true, message: '更新成功' })
})

router.delete('/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM molds WHERE id = ?').run(req.params.id)
  res.json({ success: true, message: '删除成功' })
})

export default router
