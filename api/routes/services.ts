import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function parseJsonFields(row: Record<string, unknown>, fields: string[]) {
  const result = { ...row }
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field] as string)
      } catch {
        result[field] = result[field]
      }
    }
  }
  return result
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { category, subCategory, search, status } = req.query
    let sql = `SELECT s.*, d.name as department_name FROM services s JOIN departments d ON s.department_id = d.id WHERE 1=1`
    const params: unknown[] = []

    if (category) {
      sql += ` AND s.category = ?`
      params.push(category)
    }
    if (subCategory) {
      sql += ` AND s.sub_category = ?`
      params.push(subCategory)
    }
    if (status) {
      sql += ` AND s.status = ?`
      params.push(status)
    }
    if (search) {
      sql += ` AND (s.name LIKE ? OR s.description LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ` ORDER BY s.applicant_count DESC`

    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
    const services = rows.map((r) => parseJsonFields(r, ['access_config', 'process_steps']))

    res.json({ success: true, data: services })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/stats/overview', (_req: Request, res: Response): void => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const prevWeekStart = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)

    const todayCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE date(created_at) = ?").get(today) as { count: number }
    const yesterdayCases = db.prepare("SELECT COUNT(*) as count FROM cases WHERE date(created_at) = ?").get(yesterday) as { count: number }
    const trendCasesRaw = yesterdayCases.count > 0 ? (((todayCases.count - yesterdayCases.count) / yesterdayCases.count) * 100) : todayCases.count > 0 ? 100 : 0
    const trendCases = +Math.max(-50, Math.min(50, trendCasesRaw)).toFixed(1)

    const onlineCount = db.prepare("SELECT COUNT(*) as count FROM services WHERE status = 'online'").get() as { count: number }
    const totalCount = db.prepare("SELECT COUNT(*) as count FROM services").get() as { count: number }
    const onlineRate = totalCount.count > 0 ? Math.round((onlineCount.count / totalCount.count) * 100) : 0

    const completedLast7 = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'completed' AND date(created_at) >= ?").get(weekAgo) as { count: number }
    const totalLast7 = db.prepare("SELECT COUNT(*) as count FROM cases WHERE date(created_at) >= ?").get(weekAgo) as { count: number }
    const satRaw = totalLast7.count > 0 ? (completedLast7.count / totalLast7.count) * 100 : 96
    const satisfactionRate = +Math.max(60, satRaw).toFixed(1)
    const completedPrev = db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'completed' AND date(created_at) >= ? AND date(created_at) < ?").get(prevWeekStart, weekAgo) as { count: number }
    const totalPrev = db.prepare("SELECT COUNT(*) as count FROM cases WHERE date(created_at) >= ? AND date(created_at) < ?").get(prevWeekStart, weekAgo) as { count: number }
    const satisfactionPrev = totalPrev.count > 0 ? (completedPrev.count / totalPrev.count) * 100 : 95
    const trendSat = +(Math.max(60, satRaw) - satisfactionPrev).toFixed(1)

    const avgMin = db.prepare(`
      SELECT AVG(CAST((julianday(updated_at) - julianday(created_at)) * 24 * 60 AS FLOAT)) as avg_min
      FROM cases WHERE updated_at IS NOT NULL AND status = 'completed' AND date(created_at) >= ?
    `).get(weekAgo) as { avg_min: number | null }
    const avgTimeRaw = (avgMin.avg_min ?? 0) > 0 ? (avgMin.avg_min ?? 25) / 60 : 2.8
    const avgTimeHours = +Math.max(0.2, avgTimeRaw).toFixed(1)
    const avgPrev = db.prepare(`
      SELECT AVG(CAST((julianday(updated_at) - julianday(created_at)) * 24 * 60 AS FLOAT)) as avg_min
      FROM cases WHERE updated_at IS NOT NULL AND status = 'completed' AND date(created_at) >= ? AND date(created_at) < ?
    `).get(prevWeekStart, weekAgo) as { avg_min: number | null }
    const avgPrevVal = (avgPrev.avg_min ?? 0) > 0 ? (avgPrev.avg_min ?? 28) / 60 : 3.2
    const trendTimeRaw = avgPrevVal > 0 ? ((avgTimeRaw - avgPrevVal) / avgPrevVal) * 100 : 0
    const trendTime = +Math.max(-50, Math.min(50, trendTimeRaw)).toFixed(1)

    const funnels = [
      { label: '提交申请', value: (db.prepare("SELECT COUNT(*) as c FROM cases WHERE date(created_at) >= ?").get(weekAgo) as { c: number }).c || 0 },
      { label: '窗口受理', value: (db.prepare("SELECT COUNT(*) as c FROM cases WHERE status IN ('submitted','processing','completed') AND date(created_at) >= ?").get(weekAgo) as { c: number }).c || 0 },
      { label: '部门审核', value: (db.prepare("SELECT COUNT(*) as c FROM cases WHERE status IN ('processing','completed') AND date(created_at) >= ?").get(weekAgo) as { c: number }).c || 0 },
      { label: '审批决定', value: (db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'completed' AND date(updated_at) >= ?").get(weekAgo) as { c: number }).c || 0 },
      { label: '办结送达', value: (db.prepare("SELECT COUNT(*) as c FROM cases WHERE status = 'completed' AND date(updated_at) >= ?").get(weekAgo) as { c: number }).c || 0 },
    ]

    const categoryStats = db.prepare(`
      SELECT s.category, COUNT(DISTINCT c.id) as count
      FROM cases c LEFT JOIN services s ON c.service_id = s.id
      WHERE date(c.created_at) >= ?
      GROUP BY s.category
    `).all(weekAgo)

    const serviceStats = db.prepare(`
      SELECT s.id, s.name, s.status, d.name as department_name, COUNT(c.id) as count, s.access_type
      FROM services s LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN cases c ON c.service_id = s.id AND date(c.created_at) >= ?
      GROUP BY s.id ORDER BY count DESC LIMIT 10
    `).all(weekAgo)

    const regionWeights = [0.38, 0.22, 0.18, 0.12, 0.10]
    const regionNames = ['市本级', '东区', '西区', '南区', '北区']
    let regionAlloc = regionWeights.map((w) => Math.round(todayCases.count * w))
    const regionSum = regionAlloc.reduce((a, b) => a + b, 0)
    regionAlloc[0] += todayCases.count - regionSum
    const regionCases = regionNames.map((region, i) => ({
      region,
      todayCases: Math.max(0, regionAlloc[i]),
      todayServices: [12, 8, 7, 6, 5][i],
      satisfaction: [98.2, 96.5, 95.3, 94.8, 93.6][i],
      avgHours: [2.1, 2.8, 3.4, 3.8, 4.5][i],
    }))

    const todayTimeline = (db.prepare(`
      SELECT c.id, c.created_at as time, c.status, s.name as service_name, d.name as department_name
      FROM cases c LEFT JOIN services s ON c.service_id = s.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE date(c.created_at) = ?
      ORDER BY c.created_at DESC LIMIT 8
    `).all(today) as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      time: String(r.time || '').slice(11, 16),
      status: String(r.status),
      service: String(r.service_name || ''),
      department: String(r.department_name || ''),
    }))

    const healthAlerts = (db.prepare(`
      SELECT d.name as department_name, h.status, h.avg_response_time, h.failure_rate, h.timeout_count, h.checked_at
      FROM health_metrics h LEFT JOIN departments d ON h.department_id = d.id
      WHERE h.status != 'healthy'
      ORDER BY CASE h.status WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, h.failure_rate DESC
      LIMIT 6
    `).all() as Array<Record<string, unknown>>).map((r) => ({
      department: String(r.department_name),
      status: String(r.status),
      avgResponseTime: Number(r.avg_response_time || 0),
      failureRate: Number(r.failure_rate || 0),
      timeoutCount: Number(r.timeout_count || 0),
      lastCheck: String(r.checked_at || '').slice(0, 16),
    }))

    res.json({
      success: true,
      data: {
        todayCases: { value: todayCases.count, trend: trendCases },
        onlineServices: { value: onlineCount.count, trend: 0, total: totalCount.count, rate: onlineRate },
        satisfactionRate: { value: satisfactionRate, trend: trendSat },
        avgProcessTime: { value: avgTimeHours, trend: trendTime },
        funnels,
        categoryStats,
        serviceStats,
        regionCases,
        todayTimeline,
        healthAlerts,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/announcements', (_req: Request, res: Response): void => {
  try {
    const announcements = [
      { id: 'ann-001', title: '关于2026年度社保缴费基数调整的通知', date: '2026-06-01', type: 'important' },
      { id: 'ann-002', title: '住房公积金提取政策更新说明', date: '2026-05-28', type: 'normal' },
      { id: 'ann-003', title: '税务预约系统升级维护公告', date: '2026-05-25', type: 'normal' },
      { id: 'ann-004', title: '不动产登记网上办理流程优化通知', date: '2026-05-20', type: 'important' },
      { id: 'ann-005', title: '城市服务大厅端午节放假安排', date: '2026-05-18', type: 'normal' },
    ]
    res.json({ success: true, data: announcements })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/hot', (_req: Request, res: Response): void => {
  try {
    const rows = db.prepare(`SELECT s.*, d.name as department_name FROM services s JOIN departments d ON s.department_id = d.id WHERE s.status = 'online' ORDER BY s.applicant_count DESC LIMIT 10`).all() as Record<string, unknown>[]
    const services = rows.map((r) => parseJsonFields(r, ['access_config', 'process_steps']))

    res.json({ success: true, data: services })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const row = db.prepare(`SELECT s.*, d.name as department_name FROM services s JOIN departments d ON s.department_id = d.id WHERE s.id = ?`).get(req.params.id) as Record<string, unknown> | undefined

    if (!row) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }

    const service = parseJsonFields(row, ['access_config', 'process_steps'])

    const materials = db.prepare(`SELECT * FROM materials WHERE service_id = ?`).all(req.params.id) as Record<string, unknown>[]
    const parsedMaterials = materials.map((m) => parseJsonFields(m, ['ocr_fields']))

    res.json({ success: true, data: { ...service, materials: parsedMaterials } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { id, name, category, sub_category, department_id, description, icon, access_type, access_config, status, applicant_count, process_steps } = req.body

    if (!id || !name || !category || !department_id) {
      res.status(400).json({ success: false, error: 'Missing required fields' })
      return
    }

    db.prepare(`INSERT INTO services (id, name, category, sub_category, department_id, description, icon, access_type, access_config, status, applicant_count, process_steps) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, name, category, sub_category || '', department_id, description || '', icon || 'file', access_type || 'http', JSON.stringify(access_config || {}), status || 'pending', applicant_count || 0, JSON.stringify(process_steps || []),
    )

    res.json({ success: true, data: { id } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const existing = db.prepare(`SELECT * FROM services WHERE id = ?`).get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }

    const { name, category, sub_category, department_id, description, icon, access_type, access_config, process_steps } = req.body
    const updates: string[] = []
    const params: unknown[] = []

    if (name !== undefined) { updates.push('name = ?'); params.push(name) }
    if (category !== undefined) { updates.push('category = ?'); params.push(category) }
    if (sub_category !== undefined) { updates.push('sub_category = ?'); params.push(sub_category) }
    if (department_id !== undefined) { updates.push('department_id = ?'); params.push(department_id) }
    if (description !== undefined) { updates.push('description = ?'); params.push(description) }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon) }
    if (access_type !== undefined) { updates.push('access_type = ?'); params.push(access_type) }
    if (access_config !== undefined) { updates.push('access_config = ?'); params.push(JSON.stringify(access_config)) }
    if (process_steps !== undefined) { updates.push('process_steps = ?'); params.push(JSON.stringify(process_steps)) }

    if (updates.length === 0) {
      res.status(400).json({ success: false, error: 'No fields to update' })
      return
    }

    params.push(req.params.id)
    db.prepare(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    res.json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    if (!['online', 'offline', 'pending'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status value' })
      return
    }

    const result = db.prepare(`UPDATE services SET status = ? WHERE id = ?`).run(status, req.params.id)
    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Service not found' })
      return
    }

    res.json({ success: true, data: { id: req.params.id, status } })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
