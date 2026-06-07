import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const VALID_TYPE_TRANSITIONS: Record<string, string[]> = {
  pending: ['stored', 'expired'],
  stored: ['picked_up', 'transferred', 'expired'],
  picked_up: [],
  transferred: ['stored', 'picked_up'],
  expired: [],
}

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { user_id, type, status, page = '1', limit = '20' } = req.query
    const db = getDb()

    let sql = `
      SELECT p.*, ec.name as express_company_name,
        cmp.code as compartment_code, cmp.size as compartment_size,
        c.name as cabinet_name
      FROM packages p
      LEFT JOIN express_companies ec ON p.express_company_id = ec.id
      LEFT JOIN compartments cmp ON p.compartment_id = cmp.id
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (user_id) {
      sql += ' AND p.user_id = ?'
      params.push(user_id)
    }
    if (type) {
      sql += ' AND p.type = ?'
      params.push(type)
    }
    if (status) {
      sql += ' AND p.status = ?'
      params.push(status)
    }

    if (req.user!.role === 'user' && !user_id) {
      sql += ' AND p.user_id = ?'
      params.push(req.user!.id)
    }

    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)))
    const offset = (pageNum - 1) * limitNum

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
    params.push(limitNum, offset)

    const packages = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        items: packages,
        total: countResult.total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(countResult.total / limitNum),
      },
    })
  } catch (error) {
    console.error('List packages error:', error)
    res.status(500).json({ success: false, error: '获取包裹列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const pkg = db.prepare(`
      SELECT p.*, ec.name as express_company_name,
        cmp.code as compartment_code, cmp.size as compartment_size,
        cmp.temperature_zone, c.name as cabinet_name, c.address as cabinet_address
      FROM packages p
      LEFT JOIN express_companies ec ON p.express_company_id = ec.id
      LEFT JOIN compartments cmp ON p.compartment_id = cmp.id
      LEFT JOIN cabinets c ON cmp.cabinet_id = c.id
      WHERE p.id = ?
    `).get(req.params.id)

    if (!pkg) {
      res.status(404).json({ success: false, error: '包裹不存在' })
      return
    }

    const tracking = buildTrackingTimeline(db, req.params.id)

    res.json({ success: true, data: { ...(pkg as Record<string, unknown>), tracking } })
  } catch (error) {
    console.error('Get package error:', error)
    res.status(500).json({ success: false, error: '获取包裹详情失败' })
  }
})

function buildTrackingTimeline(db: ReturnType<typeof getDb>, packageId: string): Array<{ status: string; time: string; description: string }> {
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(packageId) as Record<string, unknown> | undefined
  if (!pkg) return []

  const timeline: Array<{ status: string; time: string; description: string }> = []

  timeline.push({
    status: 'created',
    time: pkg.created_at as string,
    description: '包裹已创建',
  })

  if (pkg.status === 'stored' || pkg.status === 'picked_up' || pkg.status === 'transferred' || pkg.status === 'expired') {
    timeline.push({
      status: 'stored',
      time: (pkg.stored_at as string) || (pkg.created_at as string),
      description: `包裹已存入${pkg.compartment_id ? '柜子' : ''}`,
    })
  }

  if (pkg.status === 'picked_up') {
    timeline.push({
      status: 'picked_up',
      time: (pkg.picked_up_at as string) || '',
      description: '包裹已被取走',
    })
  }

  if (pkg.status === 'transferred') {
    timeline.push({
      status: 'transferred',
      time: (pkg.updated_at as string) || '',
      description: '包裹已转存',
    })
  }

  if (pkg.status === 'expired') {
    timeline.push({
      status: 'expired',
      time: (pkg.updated_at as string) || '',
      description: '包裹已过期',
    })
  }

  return timeline
}

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const {
      tracking_number, compartment_id, type,
      sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      express_company_id,
    } = req.body

    if (!tracking_number) {
      res.status(400).json({ success: false, error: '快递单号为必填项' })
      return
    }

    const db = getDb()
    const id = uuidv4()
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const userId = req.user!.id
    const pkgType = type || 'receive'

    let storedAt: string | null = null
    let status = 'pending'
    let actualCompartmentId = compartment_id || null

    if (compartment_id) {
      const compartment = db.prepare('SELECT * FROM compartments WHERE id = ? AND status = ?').get(compartment_id, 'available') as Record<string, unknown> | undefined
      if (!compartment) {
        res.status(400).json({ success: false, error: '指定格口不可用' })
        return
      }
      storedAt = now
      status = 'stored'
    }

    const expiryAt = pkgType === 'store'
      ? dayjs().add(168, 'hour').format('YYYY-MM-DD HH:mm:ss')
      : dayjs().add(48, 'hour').format('YYYY-MM-DD HH:mm:ss')

    const insertPkg = db.transaction(() => {
      db.prepare(`
        INSERT INTO packages (id, tracking_number, user_id, compartment_id, type, status,
          sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address,
          express_company_id, stored_at, picked_up_at, expiry_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
      `).run(id, tracking_number, userId, actualCompartmentId, pkgType, status,
        sender_name || '', sender_phone || '', sender_address || '',
        receiver_name || '', receiver_phone || '', receiver_address || '',
        express_company_id || null, storedAt, expiryAt, now, now)

      if (actualCompartmentId && status === 'stored') {
        db.prepare('UPDATE compartments SET status = ?, current_package_id = ?, updated_at = ? WHERE id = ?')
          .run('occupied', id, now, actualCompartmentId)
      }
    })

    insertPkg()

    const pkg = db.prepare(`
      SELECT p.*, ec.name as express_company_name, cmp.code as compartment_code
      FROM packages p
      LEFT JOIN express_companies ec ON p.express_company_id = ec.id
      LEFT JOIN compartments cmp ON p.compartment_id = cmp.id
      WHERE p.id = ?
    `).get(id)

    res.status(201).json({ success: true, data: pkg })
  } catch (error) {
    console.error('Create package error:', error)
    res.status(500).json({ success: false, error: '创建包裹失败' })
  }
})

router.put('/:id/status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    const db = getDb()

    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!pkg) {
      res.status(404).json({ success: false, error: '包裹不存在' })
      return
    }

    const currentStatus = pkg.status as string
    const allowed = VALID_TYPE_TRANSITIONS[currentStatus]
    if (!allowed || !allowed.includes(status)) {
      res.status(400).json({
        success: false,
        error: `不允许从 ${currentStatus} 状态变更为 ${status}，允许的变更: ${allowed?.join(', ') || '无'}`,
      })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    const updatePkg = db.transaction(() => {
      if (status === 'picked_up' && pkg.compartment_id) {
        db.prepare('UPDATE compartments SET status = ?, current_package_id = NULL, updated_at = ? WHERE id = ?')
          .run('available', now, pkg.compartment_id as string)
        db.prepare('UPDATE packages SET status = ?, picked_up_at = ?, compartment_id = NULL, updated_at = ? WHERE id = ?')
          .run(status, now, now, req.params.id)
      } else if (status === 'stored' && pkg.compartment_id) {
        db.prepare('UPDATE packages SET status = ?, stored_at = ?, updated_at = ? WHERE id = ?')
          .run(status, now, now, req.params.id)
      } else {
        db.prepare('UPDATE packages SET status = ?, updated_at = ? WHERE id = ?')
          .run(status, now, req.params.id)
      }
    })

    updatePkg()

    const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update package status error:', error)
    res.status(500).json({ success: false, error: '更新包裹状态失败' })
  }
})

router.post('/:id/notify', authMiddleware, (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!pkg) {
      res.status(404).json({ success: false, error: '包裹不存在' })
      return
    }

    const { type, title, content } = req.body
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(uuidv4(), pkg.user_id as string, type || 'package_arrival', title || '包裹通知', content || `您的包裹 ${pkg.tracking_number as string} 状态已更新`, now)

    res.json({ success: true, message: '通知已发送' })
  } catch (error) {
    console.error('Notify package error:', error)
    res.status(500).json({ success: false, error: '发送通知失败' })
  }
})

router.get('/:id/tracking', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const pkg = db.prepare('SELECT id, tracking_number, status, type FROM packages WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!pkg) {
      res.status(404).json({ success: false, error: '包裹不存在' })
      return
    }

    const tracking = buildTrackingTimeline(db, req.params.id)

    res.json({ success: true, data: { package: pkg, tracking } })
  } catch (error) {
    console.error('Get tracking error:', error)
    res.status(500).json({ success: false, error: '获取物流追踪失败' })
  }
})

export default router
