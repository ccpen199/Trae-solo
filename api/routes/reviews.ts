import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

interface ContentReview {
  id: string
  contentType: string
  contentId: string
  submittedBy: string
  submittedAt: string
  sensitiveWords: Array<{ word: string; position: number }>
  status: 'pending' | 'approved' | 'rejected'
  reviewer?: string
  reviewedAt?: string
  reviewNotes?: string
  contentPreview?: any
}

const formatReview = (row: any): ContentReview => {
  return {
    id: row.id,
    contentType: row.content_type,
    contentId: row.content_id,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    sensitiveWords: row.sensitive_words_json ? JSON.parse(row.sensitive_words_json) : [],
    status: row.status,
    reviewer: row.reviewer || undefined,
    reviewedAt: row.reviewed_at || undefined,
    reviewNotes: row.review_notes || undefined,
  }
}

const getContentPreview = (contentType: string, contentId: string) => {
  try {
    if (contentType === 'news') {
      const row = db.prepare('SELECT id, title_zh, title_it, source FROM news_items WHERE id = ?').get(contentId) as any
      if (row) {
        return {
          type: 'news',
          id: row.id,
          titleZh: row.title_zh,
          titleIt: row.title_it,
          source: row.source,
        }
      }
    } else if (contentType === 'project') {
      const row = db.prepare('SELECT id, title_zh, title_it, category FROM projects WHERE id = ?').get(contentId) as any
      if (row) {
        return {
          type: 'project',
          id: row.id,
          titleZh: row.title_zh,
          titleIt: row.title_it,
          category: row.category,
        }
      }
    } else if (contentType === 'translation') {
      const row = db
        .prepare('SELECT id, source_text, translated_text, source_lang, target_lang FROM translation_history WHERE id = ?')
        .get(contentId) as any
      if (row) {
        return {
          type: 'translation',
          id: row.id,
          sourceText: row.source_text,
          translatedText: row.translated_text,
          sourceLang: row.source_lang,
          targetLang: row.target_lang,
        }
      }
    }
  } catch {
    return null
  }
  return null
}

router.get('/', (req: Request, res: Response): void => {
  const { status, contentType } = req.query

  let sql = 'SELECT * FROM content_reviews WHERE 1=1'
  const params: any[] = []

  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (contentType) {
    sql += ' AND content_type = ?'
    params.push(contentType)
  }

  sql += ' ORDER BY submitted_at DESC'

  const rows = db.prepare(sql).all(...params) as any[]
  const reviews = rows.map((row) => {
    const review = formatReview(row)
    review.contentPreview = getContentPreview(row.content_type, row.content_id)
    return review
  })

  res.json({
    success: true,
    data: reviews,
  })
})

router.post('/:id/approve', (req: Request, res: Response): void => {
  const { id } = req.params
  const { reviewer = 'admin_001', reviewNotes } = req.body

  const row = db.prepare('SELECT * FROM content_reviews WHERE id = ?').get(id) as any
  if (!row) {
    res.status(404).json({
      success: false,
      error: 'Review not found',
    })
    return
  }

  if (row.status !== 'pending') {
    res.status(400).json({
      success: false,
      error: `Review already ${row.status}`,
    })
    return
  }

  const now = new Date().toISOString()
  db.prepare(
    'UPDATE content_reviews SET status = ?, reviewer = ?, review_notes = ?, reviewed_at = ? WHERE id = ?',
  ).run('approved', reviewer, reviewNotes || null, now, id)

  const updatedRow = db.prepare('SELECT * FROM content_reviews WHERE id = ?').get(id) as any
  const review = formatReview(updatedRow)

  res.json({
    success: true,
    data: review,
  })
})

router.post('/:id/reject', (req: Request, res: Response): void => {
  const { id } = req.params
  const { reviewer = 'admin_001', reviewNotes } = req.body

  const row = db.prepare('SELECT * FROM content_reviews WHERE id = ?').get(id) as any
  if (!row) {
    res.status(404).json({
      success: false,
      error: 'Review not found',
    })
    return
  }

  if (row.status !== 'pending') {
    res.status(400).json({
      success: false,
      error: `Review already ${row.status}`,
    })
    return
  }

  const now = new Date().toISOString()
  db.prepare(
    'UPDATE content_reviews SET status = ?, reviewer = ?, review_notes = ?, reviewed_at = ? WHERE id = ?',
  ).run('rejected', reviewer, reviewNotes || null, now, id)

  const updatedRow = db.prepare('SELECT * FROM content_reviews WHERE id = ?').get(id) as any
  const review = formatReview(updatedRow)

  res.json({
    success: true,
    data: review,
  })
})

router.get('/trace/:contentId', (req: Request, res: Response): void => {
  const { contentId } = req.params

  const rows = db
    .prepare(
      'SELECT * FROM content_reviews WHERE content_id = ? ORDER BY submitted_at ASC',
    )
    .all(contentId) as any[]

  if (rows.length === 0) {
    res.status(404).json({
      success: false,
      error: 'No review trace found for this content',
    })
    return
  }

  const contentPreview = getContentPreview(rows[0].content_type, contentId)
  const reviewHistory = rows.map((row) => ({
    id: row.id,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    reviewer: row.reviewer || null,
    reviewedAt: row.reviewed_at || null,
    reviewNotes: row.review_notes || null,
    sensitiveWords: row.sensitive_words_json ? JSON.parse(row.sensitive_words_json) : [],
  }))

  res.json({
    success: true,
    data: {
      contentId,
      contentType: rows[0].content_type,
      contentPreview,
      reviewHistory,
      currentStatus: rows[rows.length - 1].status,
    },
  })
})

export default router
