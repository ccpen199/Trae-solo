import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const router = Router()

router.get('/keys', authMiddleware, (req: Request, res: Response): void => {
  try {
    const keys = db.prepare(
      'SELECT id, name, permissions, created_by, created_at, expires_at FROM api_keys ORDER BY id',
    ).all()
    res.json({ success: true, data: keys })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/keys', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { name, permissions } = req.body
    const rawKey = `vmk_${crypto.randomBytes(16).toString('hex')}`
    const keyHash = bcrypt.hashSync(rawKey, 10)
    const result = db.prepare(
      'INSERT INTO api_keys (key_hash, name, permissions, created_by, expires_at) VALUES (?, ?, ?, ?, ?)',
    ).run(keyHash, name, JSON.stringify(permissions || []), req.user!.id, new Date(Date.now() + 365 * 86400000).toISOString())
    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        key: rawKey,
        name,
        permissions,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/keys/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: '密钥不存在' })
      return
    }
    db.prepare('DELETE FROM api_call_logs WHERE api_key_id = ?').run(req.params.id)
    db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/stats', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { startTime, endTime } = req.query
    let where = 'WHERE 1=1'
    const params: any[] = []
    if (startTime) {
      where += ' AND timestamp >= ?'
      params.push(startTime)
    }
    if (endTime) {
      where += ' AND timestamp <= ?'
      params.push(endTime)
    }
    const overall = db.prepare(
      `SELECT COUNT(*) as totalCalls,
        COALESCE(AVG(response_time), 0) as avgResponseTime
       FROM api_call_logs ${where}`,
    ).get(...params) as any
    const successCount = (db.prepare(
      `SELECT COUNT(*) as count FROM api_call_logs ${where} AND status_code >= 200 AND status_code < 400`,
    ).get(...params) as any).count
    const successRate = overall.totalCalls > 0 ? Math.round((successCount / overall.totalCalls) * 10000) / 100 : 0
    const byEndpoint = db.prepare(
      `SELECT endpoint, method, COUNT(*) as callCount,
        AVG(response_time) as avgResponseTime,
        SUM(CASE WHEN status_code >= 200 AND status_code < 400 THEN 1 ELSE 0 END) as successCount
       FROM api_call_logs ${where}
       GROUP BY endpoint, method
       ORDER BY callCount DESC`,
    ).all(...params)
    res.json({
      success: true,
      data: {
        totalCalls: overall.totalCalls || 0,
        successRate,
        avgResponseTime: Math.round(overall.avgResponseTime || 0),
        byEndpoint,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
