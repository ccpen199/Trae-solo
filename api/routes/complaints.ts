import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

function generateTicketNo(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(10000 + Math.random() * 90000)
  return `SQ${year}${month}${day}${random}`
}

function getExpectedDays(type: string): number {
  const expectedMap: Record<string, number> = {
    '安全隐患': 3,
    '市政设施': 5,
    '环境卫生': 7,
    '交通出行': 7,
    '噪音扰民': 7,
    '其他': 10,
  }
  return expectedMap[type] || 7
}

const statusMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  replied: '已回复',
  completed: '已完成',
  closed: '已关闭',
}

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { ticket_no } = req.query
    let complaints: any[]
    
    if (ticket_no) {
      complaints = db.prepare(
        'SELECT * FROM complaints WHERE user_id = ? AND ticket_no LIKE ? ORDER BY created_at DESC'
      ).all(userId, `%${ticket_no}%`)
    } else {
      complaints = db.prepare(
        'SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC'
      ).all(userId)
    }
    
    res.json({ code: 0, message: 'success', data: complaints })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/stats', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    
    const total = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE user_id = ?').get(userId) as { count: number }
    const pending = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'pending'").get(userId) as { count: number }
    const processing = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'processing'").get(userId) as { count: number }
    const replied = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'replied'").get(userId) as { count: number }
    const completed = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE user_id = ? AND status = 'completed'").get(userId) as { count: number }
    
    const byType = db.prepare(`
      SELECT type, 
             COUNT(*) as count,
             SUM(CASE WHEN status IN ('replied', 'completed', 'closed') THEN 1 ELSE 0 END) as resolved
      FROM complaints 
      WHERE user_id = ? 
      GROUP BY type 
      ORDER BY count DESC
    `).all(userId)
    
    const avgRating = db.prepare(`
      SELECT AVG(rating) as avg_rating 
      FROM complaints 
      WHERE user_id = ? AND rating IS NOT NULL
    `).get(userId) as { avg_rating: number | null }
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        total: total.count,
        pending: pending.count,
        processing: processing.count,
        replied: replied.count,
        completed: completed.count,
        byType,
        avgRating: avgRating.avg_rating || 0,
        resolutionRate: total.count > 0 ? Math.round((replied.count + completed.count) / total.count * 100) : 0,
      }
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { type, street, content, images = '[]' } = req.body
    
    if (!type || !street || !content) {
      res.json({ code: -1, message: '请提供投诉类型、街道和内容' })
      return
    }
    
    const ticketNo = generateTicketNo()
    const expectedDays = getExpectedDays(type)
    
    const rule = db.prepare(
      'SELECT department FROM ticket_route_rules WHERE street = ? AND complaint_type = ? ORDER BY priority DESC LIMIT 1'
    ).get(street, type) as any
    
    const department = rule ? rule.department : `${street}综合管理部门`
    
    const result = db.prepare(`
      INSERT INTO complaints (user_id, ticket_no, type, street, department, content, images, expected_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, ticketNo, type, street, department, content, JSON.stringify(images), expectedDays)
    
    const complaintId = Number(result.lastInsertRowid)
    
    db.prepare(`
      INSERT INTO complaint_history (complaint_id, status, department, comment)
      VALUES (?, ?, ?, ?)
    `).run(complaintId, 'pending', department, '诉求已提交，正在分配处理部门')
    
    db.prepare(`
      INSERT INTO complaint_history (complaint_id, status, department, comment)
      VALUES (?, ?, ?, ?)
    `).run(complaintId, 'processing', department, `已分拨至${department}，工作人员将尽快处理`)
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        id: complaintId,
        ticket_no: ticketNo,
        department,
        expected_days: expectedDays,
      }
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    
    const complaint = db.prepare(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM complaint_urges WHERE complaint_id = c.id) as urge_count,
             (SELECT MAX(created_at) FROM complaint_urges WHERE complaint_id = c.id) as last_urge_at
      FROM complaints c 
      WHERE c.id = ? AND c.user_id = ?
    `).get(id, userId) as any
    
    if (!complaint) {
      res.json({ code: -1, message: '投诉不存在' })
      return
    }
    
    complaint.images = JSON.parse(complaint.images || '[]')
    
    const history = db.prepare(`
      SELECT * FROM complaint_history 
      WHERE complaint_id = ? 
      ORDER BY created_at ASC
    `).all(id)
    
    const urges = db.prepare(`
      SELECT * FROM complaint_urges 
      WHERE complaint_id = ? 
      ORDER BY created_at DESC
    `).all(id)
    
    res.json({
      code: 0,
      message: 'success',
      data: {
        ...complaint,
        history,
        urges,
        status_text: statusMap[complaint.status] || complaint.status,
      }
    })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/:id/urge', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    const { reason = '' } = req.body
    
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ? AND user_id = ?').get(id, userId) as any
    
    if (!complaint) {
      res.json({ code: -1, message: '投诉不存在' })
      return
    }
    
    if (complaint.status === 'completed' || complaint.status === 'closed') {
      res.json({ code: -1, message: '该诉求已处理完成，无法催办' })
      return
    }
    
    const lastUrge = db.prepare(`
      SELECT created_at FROM complaint_urges 
      WHERE complaint_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(id) as any
    
    if (lastUrge) {
      const lastUrgeTime = new Date(lastUrge.created_at).getTime()
      const now = Date.now()
      const hoursSinceLastUrge = (now - lastUrgeTime) / (1000 * 60 * 60)
      
      if (hoursSinceLastUrge < 24) {
        res.json({ code: -1, message: '24小时内只能催办一次，请耐心等待处理' })
        return
      }
    }
    
    const createdAt = new Date(complaint.created_at).getTime()
    const now = Date.now()
    const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60)
    
    if (hoursSinceCreated < 24) {
      res.json({ code: -1, message: '诉求提交未满24小时，请耐心等待处理' })
      return
    }
    
    db.prepare(`
      INSERT INTO complaint_urges (complaint_id, user_id, reason)
      VALUES (?, ?, ?)
    `).run(id, userId, reason)
    
    db.prepare(`
      UPDATE complaints 
      SET urge_count = urge_count + 1, 
          last_urge_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(id)
    
    db.prepare(`
      INSERT INTO complaint_history (complaint_id, status, department, comment)
      VALUES (?, ?, ?, ?)
    `).run(id, complaint.status, complaint.department, reason ? `用户催办：${reason}` : '用户发起催办')
    
    res.json({ code: 0, message: '催办成功，我们会尽快处理您的诉求' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

router.post('/:id/rate', authMiddleware, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id
    const { id } = req.params
    const { rating, comment = '' } = req.body
    
    if (!rating || rating < 1 || rating > 5) {
      res.json({ code: -1, message: '请提供有效的评分（1-5星）' })
      return
    }
    
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ? AND user_id = ?').get(id, userId) as any
    
    if (!complaint) {
      res.json({ code: -1, message: '投诉不存在' })
      return
    }
    
    if (complaint.status !== 'replied' && complaint.status !== 'completed') {
      res.json({ code: -1, message: '该诉求尚未处理完成，无法评价' })
      return
    }
    
    if (complaint.rating !== null) {
      res.json({ code: -1, message: '该诉求已评价，无法重复评价' })
      return
    }
    
    db.prepare(`
      UPDATE complaints 
      SET rating = ?, 
          rating_comment = ?, 
          rated_at = datetime('now'),
          status = 'completed',
          updated_at = datetime('now')
      WHERE id = ?
    `).run(rating, comment, id)
    
    db.prepare(`
      INSERT INTO complaint_history (complaint_id, status, department, comment)
      VALUES (?, ?, ?, ?)
    `).run(id, 'completed', complaint.department, `用户评价：${rating}星${comment ? ` - ${comment}` : ''}`)
    
    res.json({ code: 0, message: '评价成功，感谢您的反馈' })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
