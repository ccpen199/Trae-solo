import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { cabinet_id, status, size } = req.query
    const db = getDb()

    let sql = `
      SELECT cmp.*, c.name as cabinet_name, c.location as cabinet_location
      FROM compartments cmp
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (cabinet_id) {
      sql += ' AND cmp.cabinet_id = ?'
      params.push(cabinet_id)
    }
    if (status) {
      sql += ' AND cmp.status = ?'
      params.push(status)
    }
    if (size) {
      sql += ' AND cmp.size = ?'
      params.push(size)
    }

    sql += ' ORDER BY cmp.cabinet_id, cmp.code'

    const compartments = db.prepare(sql).all(...params)
    res.json({ success: true, data: compartments })
  } catch (error) {
    console.error('List compartments error:', error)
    res.status(500).json({ success: false, error: '获取格口列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const compartment = db.prepare(`
      SELECT cmp.*, c.name as cabinet_name, c.location as cabinet_location, c.address as cabinet_address
      FROM compartments cmp
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE cmp.id = ?
    `).get(req.params.id)

    if (!compartment) {
      res.status(404).json({ success: false, error: '格口不存在' })
      return
    }

    res.json({ success: true, data: compartment })
  } catch (error) {
    console.error('Get compartment error:', error)
    res.status(500).json({ success: false, error: '获取格口详情失败' })
  }
})

router.put('/:id/status', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    const validStatuses = ['available', 'occupied', 'reserved', 'fault']
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值，必须为 available/occupied/reserved/fault' })
      return
    }

    const db = getDb()
    const compartment = db.prepare('SELECT * FROM compartments WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!compartment) {
      res.status(404).json({ success: false, error: '格口不存在' })
      return
    }

    if (status === 'available' && compartment.current_package_id) {
      res.status(400).json({ success: false, error: '该格口还有关联包裹，请先移除包裹' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    db.prepare('UPDATE compartments SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id)

    if (status === 'available') {
      db.prepare('UPDATE compartments SET current_package_id = NULL WHERE id = ?').run(req.params.id)
    }

    const updated = db.prepare('SELECT * FROM compartments WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update compartment status error:', error)
    res.status(500).json({ success: false, error: '更新格口状态失败' })
  }
})

router.put('/:id/assign', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { package_id } = req.body
    if (!package_id) {
      res.status(400).json({ success: false, error: '包裹ID为必填项' })
      return
    }

    const db = getDb()
    const compartment = db.prepare('SELECT * FROM compartments WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!compartment) {
      res.status(404).json({ success: false, error: '格口不存在' })
      return
    }

    if (compartment.status === 'occupied' && compartment.current_package_id) {
      res.status(409).json({ success: false, error: '该格口已被占用' })
      return
    }

    if (compartment.status === 'fault') {
      res.status(400).json({ success: false, error: '该格口故障，无法分配' })
      return
    }

    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(package_id) as Record<string, unknown> | undefined
    if (!pkg) {
      res.status(404).json({ success: false, error: '包裹不存在' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updateCompartment = db.transaction(() => {
      db.prepare('UPDATE compartments SET status = ?, current_package_id = ?, updated_at = ? WHERE id = ?')
        .run('occupied', package_id, now, req.params.id)
      db.prepare('UPDATE packages SET compartment_id = ?, status = ?, stored_at = ?, updated_at = ? WHERE id = ?')
        .run(req.params.id, 'stored', now, now, package_id)
    })

    updateCompartment()

    const updated = db.prepare('SELECT * FROM compartments WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Assign compartment error:', error)
    res.status(500).json({ success: false, error: '分配格口失败' })
  }
})

export default router
