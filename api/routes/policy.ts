import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/documents', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, keyword, page = '1', pageSize = '10' } = req.query

  let sql = 'SELECT * FROM policy_document WHERE 1=1'
  const params: string[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status as string)
  }
  if (keyword) {
    sql += ' AND (title LIKE ? OR content LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...params) as { count: number }

  const offset = (Number(page) - 1) * Number(pageSize)
  sql += ' ORDER BY issue_date DESC LIMIT ? OFFSET ?'
  params.push(String(Number(pageSize)), String(offset))

  const documents = db.prepare(sql).all(...params)

  const docsWithTags = (documents as any[]).map(doc => {
    const tags = db.prepare(`
      SELECT pt.* FROM policy_tag pt
      JOIN policy_tag_rel ptr ON pt.id = ptr.tag_id
      WHERE ptr.policy_id = ?
    `).all(doc.id)
    return { ...doc, tags }
  })

  res.json({
    success: true,
    data: {
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      documents: docsWithTags
    }
  })
})

router.get('/documents/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params

  const document = db.prepare('SELECT * FROM policy_document WHERE id = ?').get(id)
  if (!document) {
    res.status(404).json({ success: false, error: '政策文件不存在' })
    return
  }

  const tags = db.prepare(`
    SELECT pt.* FROM policy_tag pt
    JOIN policy_tag_rel ptr ON pt.id = ptr.tag_id
    WHERE ptr.policy_id = ?
  `).all(id)

  res.json({
    success: true,
    data: { ...(document as Record<string, any>), tags }
  })
})

router.get('/tags', (req: Request, res: Response): void => {
  const db = getDb()
  const { category } = req.query

  let sql = 'SELECT * FROM policy_tag WHERE 1=1'
  const params: string[] = []

  if (category) {
    sql += ' AND category = ?'
    params.push(category as string)
  }

  sql += ' ORDER BY category, name'

  const tags = db.prepare(sql).all(...params)

  const tagTree = buildTagTree(tags as any[])

  res.json({
    success: true,
    data: { tags, tagTree }
  })
})

router.post('/tags', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, category, parentId, description } = req.body

  if (!name || !category) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const id = randomUUID()
  db.prepare(`
    INSERT INTO policy_tag (id, name, category, parent_id, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, category, parentId || null, description || null)

  res.json({
    success: true,
    data: { id, name, category, parentId, description }
  })
})

router.post('/recommend', (req: Request, res: Response): void => {
  const db = getDb()
  const { userId, insuranceType, keyword } = req.body

  if (!insuranceType && !keyword) {
    res.status(400).json({ success: false, error: '请提供保险类型或关键词' })
    return
  }

  let tagIds: string[] = []

  if (insuranceType) {
    const typeTagMap: Record<string, string[]> = {
      pension: ['tag-001', 'tag-006'],
      medical: ['tag-002', 'tag-007'],
      unemployment: ['tag-003', 'tag-008'],
      work_injury: ['tag-004'],
      maternity: ['tag-005'],
    }
    tagIds = typeTagMap[insuranceType] || []
  }

  let documents: any[] = []

  if (tagIds.length > 0) {
    const placeholders = tagIds.map(() => '?').join(',')
    documents = db.prepare(`
      SELECT DISTINCT pd.* FROM policy_document pd
      JOIN policy_tag_rel ptr ON pd.id = ptr.policy_id
      WHERE ptr.tag_id IN (${placeholders}) AND pd.status = 'effective'
      ORDER BY pd.issue_date DESC
    `).all(...tagIds) as any[]
  }

  if (keyword) {
    const keywordDocs = db.prepare(`
      SELECT * FROM policy_document
      WHERE (title LIKE ? OR content LIKE ?) AND status = 'effective'
      ORDER BY issue_date DESC
    `).all(`%${keyword}%`, `%${keyword}%`) as any[]

    const existingIds = new Set(documents.map(d => d.id))
    for (const doc of keywordDocs) {
      if (!existingIds.has(doc.id)) {
        documents.push(doc)
      }
    }
  }

  const docsWithTags = documents.map(doc => {
    const tags = db.prepare(`
      SELECT pt.* FROM policy_tag pt
      JOIN policy_tag_rel ptr ON pt.id = ptr.tag_id
      WHERE ptr.policy_id = ?
    `).all(doc.id)
    return { ...doc, tags }
  })

  res.json({
    success: true,
    data: {
      insuranceType: insuranceType || null,
      keyword: keyword || null,
      count: docsWithTags.length,
      documents: docsWithTags
    }
  })
})

function buildTagTree(tags: any[]): any[] {
  const map = new Map<string, any>()
  const roots: any[] = []

  for (const tag of tags) {
    map.set(tag.id, { ...tag, children: [] })
  }

  for (const tag of tags) {
    const node = map.get(tag.id)!
    if (tag.parent_id && map.has(tag.parent_id)) {
      map.get(tag.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export default router
