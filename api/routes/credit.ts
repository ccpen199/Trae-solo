import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const user = db.prepare('SELECT id, name, email, role, org_id, credit_score, avatar FROM users WHERE id = ?').get(req.params.userId) as any

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const evaluations = db.prepare(`
      SELECT e.*, u.name as from_user_name, j.title as job_title
      FROM evaluations e
      LEFT JOIN users u ON e.from_user_id = u.id
      LEFT JOIN jobs j ON e.related_job_id = j.id
      WHERE e.to_user_id = ?
      ORDER BY e.created_at DESC
    `).all(req.params.userId) as any[]

    for (const e of evaluations) {
      e.tags = JSON.parse(e.tags || '[]')
    }

    const avgScore = evaluations.length > 0
      ? +(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length).toFixed(1)
      : 0

    let profile = null
    if (user.role === 'student') {
      profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id) as any
      if (profile) {
        profile.skills = JSON.parse(profile.skills || '[]')
        profile.certificates = JSON.parse(profile.certificates || '[]')
      }
    }

    res.json({
      success: true,
      data: {
        ...user,
        profile,
        evaluations,
        average_score: avgScore,
        evaluation_count: evaluations.length
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取信用档案失败' })
  }
})

router.post('/:userId/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { from_user_id, score, comment, tags, related_job_id } = req.body

    if (!from_user_id || !score || score < 1 || score > 5) {
      res.status(400).json({ success: false, error: '评价人和评分(1-5)不能为空' })
      return
    }

    const db = getDb()
    const toUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId) as any
    if (!toUser) {
      res.status(404).json({ success: false, error: '被评价用户不存在' })
      return
    }

    const result = db.prepare(
      `INSERT INTO evaluations (from_user_id, to_user_id, score, comment, tags, related_job_id) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(from_user_id, Number(req.params.userId), score, comment || '', JSON.stringify(tags || []), related_job_id || null)

    const evaluations = db.prepare('SELECT score FROM evaluations WHERE to_user_id = ?').all(req.params.userId) as any[]
    const avgScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
    const newCreditScore = Math.min(100, Math.max(0, Math.round(avgScore * 20)))

    db.prepare('UPDATE users SET credit_score = ? WHERE id = ?').run(newCreditScore, req.params.userId)

    const evaluation = db.prepare(`
      SELECT e.*, u.name as from_user_name
      FROM evaluations e
      LEFT JOIN users u ON e.from_user_id = u.id
      WHERE e.id = ?
    `).get(result.lastInsertRowid) as any
    if (evaluation) evaluation.tags = JSON.parse(evaluation.tags || '[]')

    res.status(201).json({ success: true, data: evaluation })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交评价失败' })
  }
})

router.get('/:userId/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.userId) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const evaluations = db.prepare('SELECT tags, score FROM evaluations WHERE to_user_id = ?').all(req.params.userId) as any[]

    const tagCount: Record<string, number> = {}
    for (const e of evaluations) {
      const tags: string[] = JSON.parse(e.tags || '[]')
      for (const tag of tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      }
    }

    const sortedTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count }))

    const avgScore = evaluations.length > 0
      ? +(evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length).toFixed(1)
      : 0

    let creditLevel = '待评估'
    if (user.credit_score >= 90) creditLevel = '优秀'
    else if (user.credit_score >= 80) creditLevel = '良好'
    else if (user.credit_score >= 70) creditLevel = '一般'
    else if (user.credit_score >= 60) creditLevel = '较差'
    else creditLevel = '不合格'

    res.json({
      success: true,
      data: {
        user_id: user.id,
        credit_score: user.credit_score,
        credit_level: creditLevel,
        average_evaluation_score: avgScore,
        evaluation_count: evaluations.length,
        tags: sortedTags
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取标签失败' })
  }
})

export default router
