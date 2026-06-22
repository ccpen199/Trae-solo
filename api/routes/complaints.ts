import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { buildingId, submitterName, submitterPhone, category, title, content } = req.body

  if (!buildingId || !title || !content) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const building = db.prepare('SELECT id FROM buildings WHERE id = ?').get(buildingId)
  if (!building) {
    res.status(404).json({ success: false, error: '楼盘不存在' })
    return
  }

  const id = uuidv4()
  const now = new Date().toISOString()
  const timeline = JSON.stringify([
    { status: 'pending', time: now, action: '提交投诉', operator: submitterName || '用户' }
  ])

  db.prepare(`INSERT INTO complaints (id, buildingId, submitterName, submitterPhone, category, title, content, status, timeline, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`).run(
    id, buildingId, submitterName || '', submitterPhone || '', category || '其他', title, content, timeline, now, now
  )

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id)

  res.json({ success: true, data: complaint })
})

router.get('/', (req: Request, res: Response): void => {
  const { buildingId, status, category } = req.query

  let sql = 'SELECT * FROM complaints WHERE 1=1'
  const params: unknown[] = []

  if (buildingId && typeof buildingId === 'string') {
    sql += ' AND buildingId = ?'
    params.push(buildingId)
  }

  if (status && typeof status === 'string') {
    sql += ' AND status = ?'
    params.push(status)
  }

  if (category && typeof category === 'string') {
    sql += ' AND category = ?'
    params.push(category)
  }

  sql += ' ORDER BY createdAt DESC'

  const complaints = db.prepare(sql).all(...params)

  res.json({ success: true, data: complaints })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Record<string, unknown> | undefined

  if (!complaint) {
    res.status(404).json({ success: false, error: '投诉不存在' })
    return
  }

  const result = {
    ...complaint,
    timeline: JSON.parse(complaint.timeline as string || '[]')
  }

  res.json({ success: true, data: result })
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status, operator } = req.body

  if (!status) {
    res.status(400).json({ success: false, error: '缺少状态参数' })
    return
  }

  const validStatuses = ['pending', 'accepted', 'processing', 'resolved', 'closed']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: '无效的状态值' })
    return
  }

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!complaint) {
    res.status(404).json({ success: false, error: '投诉不存在' })
    return
  }

  const now = new Date().toISOString()
  const timeline = JSON.parse(complaint.timeline as string || '[]')
  const actionMap: Record<string, string> = {
    pending: '提交投诉',
    accepted: '投诉受理',
    processing: '受理处理',
    resolved: '处理完成',
    closed: '投诉关闭'
  }
  timeline.push({
    status,
    time: now,
    action: actionMap[status] || '状态更新',
    operator: operator || '系统'
  })

  db.prepare('UPDATE complaints SET status = ?, timeline = ?, updatedAt = ? WHERE id = ?').run(
    status, JSON.stringify(timeline), now, id
  )

  if (status === 'processing') {
    console.log(`[开发商系统同步] 投诉 ${id} 已同步至开发商系统，状态：${status}`)
  }

  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Record<string, unknown> | undefined

  res.json({
    success: true,
    data: {
      ...(updated || {}),
      timeline
    }
  })
})

export default router
