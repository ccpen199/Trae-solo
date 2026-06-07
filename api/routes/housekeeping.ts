import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { getDb } from '../database.js'
import { authMiddleware, adminOnly } from '../middleware/auth.js'

const router = Router()

const CLEANING_TYPE_SKILLS: Record<string, string[]> = {
  daily_deep: ['daily_deep', 'kitchen', 'bathroom'],
  move_in_out: ['move_in_out', 'floor_windows', 'kitchen', 'bathroom'],
  kitchen: ['kitchen'],
  bathroom: ['bathroom'],
  floor_windows: ['floor_windows'],
}

const CLEANING_PRICES: Record<string, number> = {
  daily_deep: 80,
  move_in_out: 80,
  kitchen: 80,
  bathroom: 80,
  floor_windows: 80,
}

const STAFF_POOL = [
  { name: '保洁阿姨A', skills: ['daily_deep', 'kitchen', 'bathroom'], rating: 4.8 },
  { name: '保洁阿姨B', skills: ['daily_deep', 'bathroom', 'floor_windows'], rating: 4.5 },
  { name: '保洁师傅C', skills: ['move_in_out', 'floor_windows', 'kitchen'], rating: 4.9 },
  { name: '保洁师傅D', skills: ['move_in_out', 'daily_deep', 'bathroom'], rating: 4.6 },
  { name: '保洁阿姨E', skills: ['kitchen', 'bathroom', 'daily_deep'], rating: 4.7 },
]

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
}

router.post('/order', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { cleaning_type, duration_hours, scheduled_time, address } = req.body

    if (!cleaning_type || !duration_hours || !scheduled_time || !address) {
      res.status(400).json({ success: false, error: '清洁类型、时长、预约时间和地址为必填项' })
      return
    }

    const db = getDb()
    const id = uuidv4()
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const skillTags = CLEANING_TYPE_SKILLS[cleaning_type] || [cleaning_type]
    const amount = (CLEANING_PRICES[cleaning_type] || 80) * duration_hours

    db.prepare(`
      INSERT INTO housekeeping_orders (id, user_id, cleaning_type, duration_hours, scheduled_time, address,
        skill_tags, assigned_staff, staff_rating, status, amount, review_score, review_content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '', 0, 'pending', ?, NULL, '', ?, ?)
    `).run(id, req.user!.id, cleaning_type, duration_hours, scheduled_time, address,
      JSON.stringify(skillTags), amount, now, now)

    const order = db.prepare('SELECT * FROM housekeeping_orders WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: order })
  } catch (error) {
    console.error('Create housekeeping order error:', error)
    res.status(500).json({ success: false, error: '创建家政订单失败' })
  }
})

router.get('/orders', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { user_id, status } = req.query
    const db = getDb()

    let sql = 'SELECT * FROM housekeeping_orders WHERE 1=1'
    const params: unknown[] = []

    if (user_id) {
      sql += ' AND user_id = ?'
      params.push(user_id)
    } else if (req.user!.role === 'user') {
      sql += ' AND user_id = ?'
      params.push(req.user!.id)
    }

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC'
    const orders = db.prepare(sql).all(...params)

    res.json({ success: true, data: orders })
  } catch (error) {
    console.error('List housekeeping orders error:', error)
    res.status(500).json({ success: false, error: '获取家政订单列表失败' })
  }
})

router.get('/orders/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const order = db.prepare('SELECT * FROM housekeeping_orders WHERE id = ?').get(req.params.id)

    if (!order) {
      res.status(404).json({ success: false, error: '家政订单不存在' })
      return
    }

    res.json({ success: true, data: order })
  } catch (error) {
    console.error('Get housekeeping order error:', error)
    res.status(500).json({ success: false, error: '获取家政订单详情失败' })
  }
})

router.put('/orders/:id/assign', authMiddleware, adminOnly, (req: Request, res: Response): void => {
  try {
    const { staff_name } = req.body
    const db = getDb()

    const order = db.prepare('SELECT * FROM housekeeping_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '家政订单不存在' })
      return
    }

    if (order.status !== 'pending') {
      res.status(400).json({ success: false, error: '只有待分配的订单才能分配人员' })
      return
    }

    const orderSkills = JSON.parse((order.skill_tags as string) || '[]') as string[]
    const scheduledTime = order.scheduled_time as string

    let bestStaff: { name: string; skills: string[]; rating: number } | null = null
    let bestScore = -1

    const activeOrders = db.prepare(`
      SELECT assigned_staff, scheduled_time, duration_hours FROM housekeeping_orders
      WHERE status IN ('assigned', 'in_progress') AND assigned_staff != ''
    `).all() as Array<{ assigned_staff: string; scheduled_time: string; duration_hours: number }>

    const occupiedStaff = new Set<string>()
    for (const active of activeOrders) {
      const activeStart = dayjs(active.scheduled_time)
      const activeEnd = activeStart.add(active.duration_hours, 'hour')
      const newStart = dayjs(scheduledTime)
      const newEnd = newStart.add((order.duration_hours as number) || 2, 'hour')
      if (newStart.isBefore(activeEnd) && newEnd.isAfter(activeStart)) {
        occupiedStaff.add(active.assigned_staff)
      }
    }

    if (staff_name) {
      const staff = STAFF_POOL.find(s => s.name === staff_name)
      if (staff) {
        bestStaff = staff
      } else {
        bestStaff = { name: staff_name, skills: orderSkills, rating: 4.0 }
      }
    } else {
      for (const staff of STAFF_POOL) {
        if (occupiedStaff.has(staff.name)) continue

        const skillMatch = staff.skills.filter(s => orderSkills.includes(s)).length
        if (skillMatch === 0) continue

        const score = skillMatch * 10 + staff.rating * 2
        if (score > bestScore) {
          bestScore = score
          bestStaff = staff
        }
      }
    }

    if (!bestStaff) {
      res.status(400).json({ success: false, error: '当前没有合适的人员可分配，请稍后重试或手动指定' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const skillMatchCount = bestStaff.skills.filter(s => orderSkills.includes(s)).length

    db.prepare('UPDATE housekeeping_orders SET assigned_staff = ?, staff_rating = ?, status = ?, updated_at = ? WHERE id = ?')
      .run(bestStaff.name, bestStaff.rating, 'assigned', now, req.params.id)

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
      VALUES (?, ?, 'housekeeping_update', '家政服务已分配', ?, 0, ?)
    `).run(uuidv4(), order.user_id as string, `您的家政订单已分配给${bestStaff.name}，预约时间${scheduledTime}`, now)

    const updated = db.prepare('SELECT * FROM housekeeping_orders WHERE id = ?').get(req.params.id)
    res.json({
      success: true,
      data: {
        ...(updated as Record<string, unknown>),
        assignment_detail: {
          matched_skills: bestStaff.skills.filter(s => orderSkills.includes(s)),
          skill_match_score: skillMatchCount,
          staff_rating: bestStaff.rating,
          total_score: bestScore > 0 ? bestScore : skillMatchCount * 10 + bestStaff.rating * 2,
        },
      },
    })
  } catch (error) {
    console.error('Assign staff error:', error)
    res.status(500).json({ success: false, error: '分配人员失败' })
  }
})

router.put('/orders/:id/status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    const db = getDb()

    const order = db.prepare('SELECT * FROM housekeeping_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '家政订单不存在' })
      return
    }

    const currentStatus = order.status as string
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus]
    if (!allowed || !allowed.includes(status)) {
      res.status(400).json({
        success: false,
        error: `不允许从 ${currentStatus} 变更为 ${status}，允许: ${allowed?.join(', ') || '无'}`,
      })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    db.prepare('UPDATE housekeeping_orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id)

    if (status === 'completed') {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
        VALUES (?, ?, 'housekeeping_update', '家政服务已完成', ?, 0, ?)
      `).run(uuidv4(), order.user_id as string, '您的家政服务已完成，欢迎评价', now)
    }

    const updated = db.prepare('SELECT * FROM housekeeping_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update housekeeping status error:', error)
    res.status(500).json({ success: false, error: '更新家政订单状态失败' })
  }
})

router.post('/orders/:id/review', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { rating, content } = req.body

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: '评分必须为1-5的整数' })
      return
    }

    const db = getDb()
    const order = db.prepare('SELECT * FROM housekeeping_orders WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '家政订单不存在' })
      return
    }

    if (order.status !== 'completed') {
      res.status(400).json({ success: false, error: '只有已完成的订单才能评价' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    db.prepare('UPDATE housekeeping_orders SET review_score = ?, review_content = ?, updated_at = ? WHERE id = ?')
      .run(rating, content || '', now, req.params.id)

    db.prepare(`
      INSERT INTO service_reviews (id, user_id, order_type, order_id, rating, content, created_at)
      VALUES (?, ?, 'housekeeping', ?, ?, ?, ?)
    `).run(uuidv4(), req.user!.id, req.params.id, rating, content || '', now)

    const updated = db.prepare('SELECT * FROM housekeeping_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Review housekeeping error:', error)
    res.status(500).json({ success: false, error: '评价失败' })
  }
})

router.get('/staff/available', (req: Request, res: Response): void => {
  try {
    const { cleaning_type, scheduled_time } = req.query
    const db = getDb()

    const requiredSkills = cleaning_type
      ? (CLEANING_TYPE_SKILLS[cleaning_type as string] || [cleaning_type])
      : []

    const activeOrders = db.prepare(`
      SELECT assigned_staff, scheduled_time, duration_hours FROM housekeeping_orders
      WHERE status IN ('assigned', 'in_progress') AND assigned_staff != ''
    `).all() as Array<{ assigned_staff: string; scheduled_time: string; duration_hours: number }>

    const occupiedStaff = new Set<string>()
    if (scheduled_time) {
      for (const active of activeOrders) {
        const activeStart = dayjs(active.scheduled_time)
        const activeEnd = activeStart.add(active.duration_hours, 'hour')
        const newStart = dayjs(scheduled_time as string)
        const newEnd = newStart.add(2, 'hour')
        if (newStart.isBefore(activeEnd) && newEnd.isAfter(activeStart)) {
          occupiedStaff.add(active.assigned_staff)
        }
      }
    }

    const availableStaff = STAFF_POOL.map(staff => {
      const isOccupied = occupiedStaff.has(staff.name)
      const matchedSkills = staff.skills.filter(s => requiredSkills.includes(s))
      const skillMatchScore = matchedSkills.length

      return {
        ...staff,
        is_available: !isOccupied,
        matched_skills: matchedSkills,
        skill_match_score: skillMatchScore,
        recommendation_score: !isOccupied ? skillMatchScore * 10 + staff.rating * 2 : -1,
      }
    }).sort((a, b) => b.recommendation_score - a.recommendation_score)

    res.json({ success: true, data: availableStaff })
  } catch (error) {
    console.error('Get available staff error:', error)
    res.status(500).json({ success: false, error: '获取可用人员列表失败' })
  }
})

export default router
