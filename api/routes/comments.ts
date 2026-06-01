import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function buildCommentTree(comments: any[]): any[] {
  const map = new Map<number, any>()
  const roots: any[] = []
  for (const c of comments) {
    c.replies = []
    map.set(c.id, c)
  }
  for (const c of comments) {
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id).replies.push(c)
    } else {
      roots.push(c)
    }
  }
  return roots
}

router.get('/steps/:stepId/comments', (req: Request, res: Response): void => {
  const db = getDb()
  const comments = db.prepare(`
    SELECT c.*, u.username as author_name, u.role as author_role
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.step_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.stepId)
  res.json(buildCommentTree(comments))
})

router.post('/steps/:stepId/comments', (req: Request, res: Response): void => {
  const content = req.body.content || req.body.content
  const issue_type = req.body.issue_type || req.body.issueType
  const parent_comment_id = req.body.parent_comment_id || req.body.parentCommentId
  const author_id = req.body.author_id || req.body.authorId
  if (!content) {
    res.status(400).json({ error: 'content is required' })
    return
  }
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO comments (step_id, author_id, content, issue_type, parent_comment_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    req.params.stepId,
    author_id || null,
    content,
    issue_type || null,
    parent_comment_id || null
  )
  const comment = db.prepare(`
    SELECT c.*, u.username as author_name, u.role as author_role
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid)
  res.status(201).json(comment)
})

router.put('/comments/:commentId', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM comments WHERE id = ?').get(req.params.commentId)
  if (!existing) {
    res.status(404).json({ error: 'comment not found' })
    return
  }
  const content = req.body.content ?? null
  const issue_type = req.body.issue_type ?? req.body.issueType ?? null
  const resolved = req.body.resolved ?? null
  db.prepare(`
    UPDATE comments SET
      content = COALESCE(?, content),
      issue_type = COALESCE(?, issue_type),
      resolved = COALESCE(?, resolved),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    content,
    issue_type,
    resolved,
    req.params.commentId
  )
  const comment = db.prepare(`
    SELECT c.*, u.username as author_name, u.role as author_role
    FROM comments c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.id = ?
  `).get(req.params.commentId)
  res.json(comment)
})

router.delete('/comments/:commentId', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM comments WHERE id = ?').get(req.params.commentId)
  if (!existing) {
    res.status(404).json({ error: 'comment not found' })
    return
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId)
  res.json({ success: true })
})

export default router
