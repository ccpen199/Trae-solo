import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/issues', (_req: Request, res: Response): void => {
  const db = getDb()
  const issueTypes = db.prepare(`
    SELECT issue_type as type, COUNT(*) as count
    FROM comments
    WHERE issue_type IS NOT NULL
    GROUP BY issue_type
    ORDER BY count DESC
  `).all()

  const topIssues = db.prepare(`
    SELECT c.*, u.username as author_name, u.role as author_role
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.resolved = 0
    ORDER BY c.created_at DESC
    LIMIT 10
  `).all()

  res.json({ issueTypes, topIssues })
})

router.get('/rounds', (_req: Request, res: Response): void => {
  const db = getDb()
  const rounds = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.status,
      (SELECT COUNT(*) FROM steps WHERE scheme_id = s.id) as step_count,
      (SELECT COUNT(*) FROM comments c JOIN steps st ON c.step_id = st.id WHERE st.scheme_id = s.id) as comment_count,
      (SELECT COUNT(*) FROM steps WHERE scheme_id = s.id AND status = 'approved') as approved_step_count
    FROM schemes s
    ORDER BY s.created_at DESC
  `).all()
  res.json(rounds)
})

router.get('/risks', (_req: Request, res: Response): void => {
  const db = getDb()
  const risks = db.prepare(`
    SELECT c.*, u.username as author_name, u.role as author_role,
      st.title as step_title, st.scheme_id
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    LEFT JOIN steps st ON c.step_id = st.id
    WHERE c.resolved = 0 AND c.issue_type IS NOT NULL
    ORDER BY c.created_at DESC
  `).all()
  res.json(risks)
})

router.get('/feedback', (_req: Request, res: Response): void => {
  const db = getDb()
  const feedback = db.prepare(`
    SELECT c.*, u.username as author_name, u.role as author_role,
      st.title as step_title, st.scheme_id
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    LEFT JOIN steps st ON c.step_id = st.id
    WHERE u.role = 'researcher'
    ORDER BY c.created_at DESC
  `).all()
  res.json(feedback)
})

export default router
