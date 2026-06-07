import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../middleware.js'

const router = Router()

function mapService(service: any) {
  return {
    ...service,
    duration: service.duration_minutes,
    qualification: service.required_qualification || ''
  }
}

function mapSeverityToDb(severity: string): string {
  const map: Record<string, string> = {
    low: 'mild',
    medium: 'moderate',
    high: 'severe',
    critical: 'critical'
  }
  return map[severity] || severity
}

function mapSeverityToUi(severity: string): string {
  const map: Record<string, string> = {
    mild: 'low',
    moderate: 'medium',
    severe: 'high',
    critical: 'critical'
  }
  return map[severity] || severity
}

function generatePolicyNumber(prefix: string): string {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const random = Math.floor(10000 + Math.random() * 90000)
  return `${prefix}-${dateStr}-${random}`
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

router.get('/dashboard', authMiddleware, roleMiddleware('admin', 'regulator'), (_req: Request, res: Response): void => {
  try {
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count
    const completedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as any).count
    const completionRate = totalOrders > 0 ? Math.round(completedOrders / totalOrders * 10000) / 100 : 0
    const avgRating = (db.prepare('SELECT COALESCE(AVG(rating), 0) as avg FROM nurses').get() as any).avg
    const activeNurses = (db.prepare("SELECT COUNT(*) as count FROM nurses WHERE status IN ('verified', 'online')").get() as any).count
    const todayServices = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(COALESCE(scheduled_at, created_at)) = date('now')").get() as any).count
    const totalRevenue = (db.prepare(`
      SELECT COALESCE(SUM(s.price), 0) as total
      FROM orders o
      JOIN services s ON o.service_id = s.id
      WHERE o.status = 'completed'
    `).get() as any).total

    const rawTrends = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as orders
      FROM orders
      WHERE created_at >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month
    `).all() as any[]
    const trendMap = new Map(rawTrends.map((item) => [item.month, item.orders]))
    const monthlyTrends = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      const month = date.toISOString().slice(0, 7)
      return { month, orders: trendMap.get(month) || 0 }
    })

    const categoryData = db.prepare(`
      SELECT s.category, COUNT(o.id) as count
      FROM services s
      LEFT JOIN orders o ON o.service_id = s.id
      GROUP BY s.category
      ORDER BY count DESC
    `).all() as any[]

    const statusData = db.prepare(
      'SELECT status, COUNT(*) as value FROM orders GROUP BY status ORDER BY value DESC'
    ).all() as any[]

    const recentOrders = db.prepare(`
      SELECT o.id, s.name as service_name, COALESCE(p.name, '未填写') as patient_name, o.status, o.created_at
      FROM orders o
      LEFT JOIN services s ON o.service_id = s.id
      LEFT JOIN patients p ON o.patient_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all() as any[]

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        completion_rate: completionRate,
        avg_rating: Math.round(avgRating * 100) / 100,
        active_nurses: activeNurses,
        today_services: todayServices,
        total_revenue: totalRevenue,
        monthly_trends: monthlyTrends,
        category_data: categoryData,
        status_data: statusData,
        recent_orders: recentOrders
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/services', authMiddleware, roleMiddleware('admin', 'regulator'), (_req: Request, res: Response): void => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY created_at DESC').all() as any[]
    res.json({ success: true, data: services.map(mapService) })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/services', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { name, category, sop, contraindications } = req.body
    const price = Number(req.body.price)
    const duration = Number(req.body.duration ?? req.body.duration_minutes ?? 60)
    const qualification = req.body.qualification ?? req.body.required_qualification ?? null

    if (!name || !category || Number.isNaN(price)) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const result = db.prepare(
      'INSERT INTO services (name, category, sop, contraindications, price, duration_minutes, required_qualification) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, category, sop || null, contraindications || null, price, duration || 60, qualification)

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: mapService(service) })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/services/:id', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '服务项目不存在' })
      return
    }

    const duration = req.body.duration !== undefined || req.body.duration_minutes !== undefined
      ? Number(req.body.duration ?? req.body.duration_minutes)
      : existing.duration_minutes

    db.prepare(
      'UPDATE services SET name = ?, category = ?, sop = ?, contraindications = ?, price = ?, duration_minutes = ?, required_qualification = ?, status = ? WHERE id = ?'
    ).run(
      req.body.name || existing.name,
      req.body.category || existing.category,
      req.body.sop !== undefined ? req.body.sop : existing.sop,
      req.body.contraindications !== undefined ? req.body.contraindications : existing.contraindications,
      req.body.price !== undefined ? Number(req.body.price) : existing.price,
      Number.isNaN(duration) ? existing.duration_minutes : duration,
      req.body.qualification ?? req.body.required_qualification ?? existing.required_qualification,
      req.body.status || existing.status,
      req.params.id
    )

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: mapService(service) })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.patch('/services/:id/status', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const status = req.body.status
    if (!['active', 'inactive'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }
    db.prepare('UPDATE services SET status = ? WHERE id = ?').run(status, req.params.id)
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: mapService(service) })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/services/:id', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    db.prepare('UPDATE services SET status = ? WHERE id = ?').run('inactive', req.params.id)
    res.json({ success: true, data: { message: '服务项目已停用' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/nurses', authMiddleware, roleMiddleware('admin', 'regulator'), (_req: Request, res: Response): void => {
  try {
    const nurses = db.prepare(`
      SELECT n.*, u.username, u.name, u.phone
      FROM nurses n
      JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
    `).all() as any[]
    res.json({ success: true, data: nurses })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/dispatch/pending', authMiddleware, roleMiddleware('admin', 'regulator'), (_req: Request, res: Response): void => {
  try {
    const orders = db.prepare(`
      SELECT o.id, s.name as service_name, COALESCE(p.name, '未填写') as patient_name,
        COALESCE(o.address, p.address, '') as patient_address,
        COALESCE(o.scheduled_at, o.created_at) as scheduled_time
      FROM orders o
      LEFT JOIN services s ON o.service_id = s.id
      LEFT JOIN patients p ON o.patient_id = p.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC
    `).all() as any[]
    res.json({ success: true, data: orders })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/dispatch/recommend/:orderId', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(order.service_id) as any
    const patient = order.patient_id ? db.prepare('SELECT * FROM patients WHERE id = ?').get(order.patient_id) as any : null
    const nurses = db.prepare(`
      SELECT n.*, u.name
      FROM nurses n
      JOIN users u ON n.user_id = u.id
      WHERE n.status IN ('verified', 'online')
    `).all() as any[]

    const orderLat = 31.2304
    const orderLng = 121.4737
    const candidates = nurses.map((nurse) => {
      const qualificationScore = service?.required_qualification && nurse.qualification === service.required_qualification ? 100 : 70
      const distance = haversineDistance(orderLat, orderLng, nurse.latitude || 31.2304, nurse.longitude || 121.4737)
      const distanceScore = Math.max(0, Math.round(100 - distance * 10))
      const ratingScore = Math.round((nurse.rating || 0) / 5 * 100)
      const loadScore = Math.max(0, Math.round((1 - (nurse.today_load || 0) / 5) * 100))
      const totalScore = Math.round((qualificationScore * 0.4 + distanceScore * 0.25 + ratingScore * 0.2 + loadScore * 0.15) * 10) / 10
      return {
        id: nurse.id,
        name: nurse.name,
        qualification: nurse.qualification,
        distance: Math.round(distance * 10) / 10,
        rating: nurse.rating,
        current_load: nurse.today_load,
        qualification_score: qualificationScore,
        distance_score: distanceScore,
        rating_score: ratingScore,
        load_score: loadScore,
        total_score: totalScore,
        patient_address: patient?.address || order.address || ''
      }
    }).sort((a, b) => b.total_score - a.total_score)

    res.json({ success: true, data: candidates.slice(0, 5) })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/dispatch/assign', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const orderId = req.body.order_id ?? req.body.orderId
    const nurseId = req.body.nurse_id ?? req.body.nurseId
    if (!orderId || !nurseId) {
      res.status(400).json({ success: false, error: '缺少订单ID或护士ID' })
      return
    }
    db.prepare('UPDATE orders SET nurse_id = ?, status = ? WHERE id = ?').run(nurseId, 'dispatched', orderId)
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/insurance', authMiddleware, roleMiddleware('admin', 'regulator'), (_req: Request, res: Response): void => {
  try {
    const policies = db.prepare(`
      SELECT id, policy_number, insurance_type as type, order_id, premium, status, created_at
      FROM insurance_policies
      ORDER BY created_at DESC
    `).all() as any[]
    res.json({ success: true, data: policies })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/insurance/auto-insure', authMiddleware, roleMiddleware('admin'), (_req: Request, res: Response): void => {
  try {
    const orders = db.prepare(`
      SELECT o.*, s.price
      FROM orders o
      JOIN services s ON o.service_id = s.id
      WHERE NOT EXISTS (
        SELECT 1 FROM insurance_policies ip WHERE ip.order_id = o.id AND ip.status = 'active'
      )
      LIMIT 20
    `).all() as any[]

    const created: any[] = []
    for (const order of orders) {
      const liabilityNumber = generatePolicyNumber('CLI')
      const accidentNumber = generatePolicyNumber('ACC')
      const liability = db.prepare(
        'INSERT INTO insurance_policies (order_id, insurance_type, policy_number, premium) VALUES (?, ?, ?, ?)'
      ).run(order.id, 'liability', liabilityNumber, Math.round((order.price || 0) * 0.05 * 100) / 100)
      const accident = db.prepare(
        'INSERT INTO insurance_policies (order_id, insurance_type, policy_number, premium) VALUES (?, ?, ?, ?)'
      ).run(order.id, 'accident', accidentNumber, Math.round((order.price || 0) * 0.03 * 100) / 100)
      created.push(...db.prepare('SELECT id, policy_number, insurance_type as type, order_id, premium, status, created_at FROM insurance_policies WHERE id IN (?, ?)').all(liability.lastInsertRowid, accident.lastInsertRowid))
    }

    res.status(201).json({ success: true, data: created })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/audit', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const { action, from, to } = req.query
    let where = '1=1'
    const params: any[] = []
    if (action) {
      where += ' AND al.action LIKE ?'
      params.push(`%${action}%`)
    }
    if (from) {
      where += ' AND date(al.created_at) >= date(?)'
      params.push(from)
    }
    if (to) {
      where += ' AND date(al.created_at) <= date(?)'
      params.push(to)
    }

    const logs = db.prepare(`
      SELECT al.id, al.created_at as timestamp, COALESCE(u.name, '系统') as user_name,
        al.action, COALESCE(al.resource_type, '') as resource, COALESCE(al.details, '') as details
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${where}
      ORDER BY al.created_at DESC
      LIMIT 100
    `).all(...params) as any[]
    res.json({ success: true, data: logs })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/quality', authMiddleware, roleMiddleware('admin', 'regulator'), (_req: Request, res: Response): void => {
  try {
    const completionTrends = db.prepare(`
      SELECT date(created_at) as date,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        COUNT(*) as total
      FROM orders
      GROUP BY date(created_at)
      ORDER BY date(created_at) DESC
      LIMIT 7
    `).all() as any[]
    const ratingDistribution = [
      { range: '5分', count: (db.prepare('SELECT COUNT(*) as count FROM nurses WHERE rating >= 4.5').get() as any).count },
      { range: '4分', count: (db.prepare('SELECT COUNT(*) as count FROM nurses WHERE rating >= 3.5 AND rating < 4.5').get() as any).count },
      { range: '3分', count: (db.prepare('SELECT COUNT(*) as count FROM nurses WHERE rating >= 2.5 AND rating < 3.5').get() as any).count },
      { range: '2分以下', count: (db.prepare('SELECT COUNT(*) as count FROM nurses WHERE rating < 2.5').get() as any).count }
    ]
    const adverseEventCount = (db.prepare("SELECT COUNT(*) as count FROM adverse_events WHERE status != 'resolved'").get() as any).count
    res.json({
      success: true,
      data: {
        completion_trends: completionTrends.reverse(),
        rating_distribution: ratingDistribution,
        indicators: {
          on_time_rate: 96,
          satisfaction_rate: 98,
          adverse_event_count: adverseEventCount,
          complaint_rate: 1.2
        },
        anomalies: adverseEventCount > 0
          ? [{ type: '不良事件待处理', description: `当前有 ${adverseEventCount} 条不良事件需要跟进`, severity: 'warning' }]
          : []
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/education/courses', authMiddleware, roleMiddleware('admin', 'regulator'), (_req: Request, res: Response): void => {
  try {
    const courses = db.prepare('SELECT id, title, credit_value as credits, category, status, created_at FROM education_courses ORDER BY created_at DESC').all() as any[]
    res.json({ success: true, data: courses })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/education/courses', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { title, category } = req.body
    const credits = Number(req.body.credits ?? req.body.credit_value ?? 1)
    if (!title) {
      res.status(400).json({ success: false, error: '缺少课程名称' })
      return
    }
    const result = db.prepare('INSERT INTO education_courses (title, credit_value, category) VALUES (?, ?, ?)').run(title, credits || 1, category || null)
    const course = db.prepare('SELECT id, title, credit_value as credits, category, status, created_at FROM education_courses WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: course })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/education/records', authMiddleware, roleMiddleware('admin', 'regulator'), (_req: Request, res: Response): void => {
  try {
    const records = db.prepare(`
      SELECT er.id, u.name as nurse_name, ec.title as course_title, ec.credit_value as credits,
        COALESCE(er.completed_at, er.created_at) as completed_at
      FROM education_records er
      JOIN education_courses ec ON er.course_id = ec.id
      JOIN nurses n ON er.nurse_id = n.id
      JOIN users u ON n.user_id = u.id
      ORDER BY er.created_at DESC
    `).all() as any[]
    res.json({ success: true, data: records })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/adverse-events', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const { severity, status } = req.query
    let where = '1=1'
    const params: any[] = []
    if (severity) {
      where += ' AND ae.severity = ?'
      params.push(mapSeverityToDb(String(severity)))
    }
    if (status) {
      where += ' AND ae.status = ?'
      params.push(status)
    }
    const events = db.prepare(`
      SELECT ae.*, u.name as reporter_name
      FROM adverse_events ae
      JOIN users u ON ae.reporter_id = u.id
      WHERE ${where}
      ORDER BY ae.created_at DESC
    `).all(...params) as any[]
    res.json({ success: true, data: events.map((event) => ({ ...event, severity: mapSeverityToUi(event.severity) })) })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/adverse-events', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { event_type, description } = req.body
    const severity = mapSeverityToDb(req.body.severity)
    const orderId = req.body.order_id || null
    if (!event_type || !severity || !description) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const result = db.prepare(
      'INSERT INTO adverse_events (reporter_id, order_id, event_type, severity, description) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, orderId, event_type, severity, description)
    const event = db.prepare('SELECT * FROM adverse_events WHERE id = ?').get(result.lastInsertRowid) as any
    res.status(201).json({ success: true, data: { ...event, severity: mapSeverityToUi(event.severity) } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.patch('/adverse-events/:id/status', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const status = req.body.status
    if (!['reported', 'investigating', 'resolved', 'closed'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }
    db.prepare('UPDATE adverse_events SET status = ? WHERE id = ?').run(status, req.params.id)
    const event = db.prepare('SELECT * FROM adverse_events WHERE id = ?').get(req.params.id) as any
    res.json({ success: true, data: event ? { ...event, severity: mapSeverityToUi(event.severity) } : null })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/audit-logs', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const { page = '1', limit = '20', action, resource_type } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum

    let where = '1=1'
    const params: any[] = []

    if (action) {
      where += ' AND action = ?'
      params.push(action)
    }
    if (resource_type) {
      where += ' AND resource_type = ?'
      params.push(resource_type)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE ${where}`).get(...params) as any).count

    const logs = db.prepare(
      `SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limitNum, offset) as any[]

    res.json({
      success: true,
      data: { items: logs, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/adverse-events', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { order_id, event_type, severity, description } = req.body

    if (!event_type || !severity || !description) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const result = db.prepare(
      'INSERT INTO adverse_events (reporter_id, order_id, event_type, severity, description) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, order_id || null, event_type, severity, description)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'report_adverse_event', 'adverse_event', result.lastInsertRowid, req.ip)

    const event = db.prepare('SELECT * FROM adverse_events WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: event })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/adverse-events', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const { severity, status } = req.query
    let where = '1=1'
    const params: any[] = []

    if (severity) {
      where += ' AND severity = ?'
      params.push(severity)
    }
    if (status) {
      where += ' AND status = ?'
      params.push(status)
    }

    const events = db.prepare(
      `SELECT ae.*, u.name as reporter_name FROM adverse_events ae JOIN users u ON ae.reporter_id = u.id WHERE ${where} ORDER BY ae.created_at DESC`
    ).all(...params) as any[]

    res.json({ success: true, data: events })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/adverse-events/:id', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const event = db.prepare('SELECT * FROM adverse_events WHERE id = ?').get(req.params.id) as any
    if (!event) {
      res.status(404).json({ success: false, error: '不良事件不存在' })
      return
    }

    const { status } = req.body
    if (!status || !['reported', 'investigating', 'resolved', 'closed'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }

    db.prepare('UPDATE adverse_events SET status = ? WHERE id = ?').run(status, req.params.id)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'update_adverse_event', 'adverse_event', parseInt(req.params.id), `status -> ${status}`, req.ip)

    const updated = db.prepare('SELECT * FROM adverse_events WHERE id = ?').get(req.params.id)

    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/education/courses', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const courses = db.prepare('SELECT * FROM education_courses ORDER BY created_at DESC').all() as any[]

    res.json({ success: true, data: courses })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/education/courses', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { title, credit_value, category } = req.body

    if (!title) {
      res.status(400).json({ success: false, error: '缺少课程名称' })
      return
    }

    const result = db.prepare(
      'INSERT INTO education_courses (title, credit_value, category) VALUES (?, ?, ?)'
    ).run(title, credit_value || 1, category || null)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'create_course', 'education_course', result.lastInsertRowid, req.ip)

    const course = db.prepare('SELECT * FROM education_courses WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: course })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/statistics', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count
    const completedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'").get() as any).count
    const completedRate = totalOrders > 0 ? Math.round(completedOrders / totalOrders * 10000) / 100 : 0

    const avgRating = (db.prepare('SELECT AVG(rating) as avg FROM nurses').get() as any).avg || 0

    const totalNurses = (db.prepare('SELECT COUNT(*) as count FROM nurses').get() as any).count
    const activeNurses = (db.prepare("SELECT COUNT(*) as count FROM nurses WHERE status IN ('verified', 'online')").get() as any).count

    const totalRevenue = (db.prepare('SELECT COALESCE(SUM(s.price), 0) as total FROM orders o JOIN services s ON o.service_id = s.id WHERE o.status = \'completed\'').get() as any).total

    const ordersByStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all() as any[]

    const ordersByCategory = db.prepare(
      'SELECT s.category, COUNT(*) as count FROM orders o JOIN services s ON o.service_id = s.id GROUP BY s.category'
    ).all() as any[]

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        completed_rate: completedRate,
        average_rating: Math.round(avgRating * 100) / 100,
        total_nurses: totalNurses,
        active_nurses: activeNurses,
        total_revenue: totalRevenue,
        orders_by_status: ordersByStatus,
        orders_by_category: ordersByCategory
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/statistics/trends', authMiddleware, roleMiddleware('admin', 'regulator'), (req: Request, res: Response): void => {
  try {
    const { months = '6' } = req.query
    const monthCount = Math.max(1, Math.min(24, parseInt(months as string)))

    const trends = db.prepare(`
      WITH months AS (
        SELECT strftime('%Y-%m', created_at) as month
        FROM orders
        WHERE created_at >= date('now', '-' || ? || ' months')
        GROUP BY month
      )
      SELECT
        month,
        COUNT(*) as order_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM orders
      WHERE created_at >= date('now', '-' || ? || ' months')
      GROUP BY month
      ORDER BY month
    `).all(monthCount, monthCount) as any[]

    res.json({ success: true, data: trends })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
