import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, job_id, page = '1', pageSize = '10' } = req.query
    const db = getDb()

    let sql = `
      SELECT
        i.*,
        j.title as job_title,
        a.status as application_status,
        (SELECT COUNT(DISTINCT sender_id) FROM interview_messages WHERE interview_id = i.id AND type != 'system') as participant_count,
        (SELECT COUNT(*) FROM interview_messages WHERE interview_id = i.id AND type = 'file') as file_count,
        (SELECT COUNT(*) FROM interview_messages WHERE interview_id = i.id AND type = 'text') as message_count
      FROM interviews i
      LEFT JOIN jobs j ON i.job_id = j.id
      LEFT JOIN applications a ON i.application_id = a.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      sql += ` AND i.status = ?`
      params.push(status)
    }
    if (job_id) {
      sql += ` AND i.job_id = ?`
      params.push(job_id)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY i.scheduled_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const interviews = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        items: interviews,
        total: countResult.total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取面试列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_id, application_id, type, scheduled_at } = req.body

    if (!job_id) {
      res.status(400).json({ success: false, error: '岗位ID不能为空' })
      return
    }

    const db = getDb()
    const result = db.prepare(
      `INSERT INTO interviews (job_id, application_id, type, status, scheduled_at) VALUES (?, ?, ?, 'scheduled', ?)`
    ).run(job_id, application_id || null, type || 'group_chat', scheduled_at || null)

    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: interview })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建面试失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const interview = db.prepare(`
      SELECT i.*, j.title as job_title FROM interviews i LEFT JOIN jobs j ON i.job_id = j.id WHERE i.id = ?
    `).get(req.params.id) as any

    if (!interview) {
      res.status(404).json({ success: false, error: '面试不存在' })
      return
    }

    const messages = db.prepare(`
      SELECT
        im.*,
        u.name as sender_name,
        u.avatar as sender_avatar,
        CASE u.role
          WHEN 'hr' THEN 'HR'
          WHEN 'mentor' THEN '导师'
          WHEN 'student' THEN '学生'
          ELSE 'HR'
        END as role
      FROM interview_messages im
      JOIN users u ON im.sender_id = u.id
      WHERE im.interview_id = ?
      ORDER BY im.created_at ASC
    `).all(req.params.id)

    res.json({ success: true, data: { ...interview, messages } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取面试详情失败' })
  }
})

router.post('/:id/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sender_id, content, type } = req.body

    if (!sender_id || !content) {
      res.status(400).json({ success: false, error: '发送者和内容不能为空' })
      return
    }

    const db = getDb()
    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id) as any
    if (!interview) {
      res.status(404).json({ success: false, error: '面试不存在' })
      return
    }

    if (interview.status === 'scheduled') {
      db.prepare('UPDATE interviews SET status = ? WHERE id = ?').run('in_progress', req.params.id)
    }

    const result = db.prepare(
      `INSERT INTO interview_messages (interview_id, sender_id, content, type) VALUES (?, ?, ?, ?)`
    ).run(Number(req.params.id), sender_id, content, type || 'text')

    const message = db.prepare(`
      SELECT
        im.*,
        u.name as sender_name,
        u.avatar as sender_avatar,
        CASE u.role
          WHEN 'hr' THEN 'HR'
          WHEN 'mentor' THEN '导师'
          WHEN 'student' THEN '学生'
          ELSE 'HR'
        END as role
      FROM interview_messages im
      JOIN users u ON im.sender_id = u.id
      WHERE im.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: message })
  } catch (error) {
    res.status(500).json({ success: false, error: '发送消息失败' })
  }
})

router.post('/:id/files', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sender_id, file_url, content } = req.body

    if (!sender_id || !file_url) {
      res.status(400).json({ success: false, error: '发送者和文件地址不能为空' })
      return
    }

    const db = getDb()
    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id) as any
    if (!interview) {
      res.status(404).json({ success: false, error: '面试不存在' })
      return
    }

    const result = db.prepare(
      `INSERT INTO interview_messages (interview_id, sender_id, content, type, file_url) VALUES (?, ?, ?, 'file', ?)`
    ).run(Number(req.params.id), sender_id, content || '分享了一个文件', file_url)

    const message = db.prepare(`
      SELECT
        im.*,
        u.name as sender_name,
        u.avatar as sender_avatar,
        CASE u.role
          WHEN 'hr' THEN 'HR'
          WHEN 'mentor' THEN '导师'
          WHEN 'student' THEN '学生'
          ELSE 'HR'
        END as role
      FROM interview_messages im
      JOIN users u ON im.sender_id = u.id
      WHERE im.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: message })
  } catch (error) {
    res.status(500).json({ success: false, error: '分享文件失败' })
  }
})

router.get('/:id/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id) as any
    if (!interview) {
      res.status(404).json({ success: false, error: '面试不存在' })
      return
    }

    if (interview.summary) {
      res.json({ success: true, data: { summary: interview.summary } })
      return
    }

    const messages = db.prepare(`
      SELECT im.content, im.type, u.name as sender_name
      FROM interview_messages im
      JOIN users u ON im.sender_id = u.id
      WHERE im.interview_id = ?
      ORDER BY im.created_at ASC
    `).all(req.params.id) as any[]

    const participants = [...new Set(messages.map(m => m.sender_name))]
    const textMessages = messages.filter(m => m.type === 'text')
    const summary = `本次面试共有${participants.length}人参与，交流了${textMessages.length}条消息。` +
      (interview.status === 'completed' ? '面试已结束。' : '面试进行中。') +
      `主要讨论了岗位相关技能和项目经验。`

    db.prepare('UPDATE interviews SET summary = ? WHERE id = ?').run(summary, req.params.id)

    res.json({ success: true, data: { summary } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取面试纪要失败' })
  }
})

export default router
