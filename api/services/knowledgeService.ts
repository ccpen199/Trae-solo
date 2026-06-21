import { nanoid } from 'nanoid'
import db from '../db/index.js'

export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  summary?: string
  content: string
  cover_image?: string
  author?: string
  views: number
  likes: number
  tags?: string
  status: string
  created_at: string
  updated_at: string
}

export function createArticle(data: Omit<KnowledgeArticle, 'id' | 'views' | 'likes' | 'created_at' | 'updated_at' | 'status'> & { status?: string }): KnowledgeArticle {
  const id = nanoid()
  const status = data.status || 'published'
  db.prepare(`
    INSERT INTO knowledge_articles (id, title, category, summary, content, cover_image, author, tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.title, data.category, data.summary || '', data.content, data.cover_image || '', data.author || '', data.tags || JSON.stringify([]), status)
  return db.prepare('SELECT * FROM knowledge_articles WHERE id = ?').get(id) as KnowledgeArticle
}

export function getArticleById(id: string): KnowledgeArticle | undefined {
  db.prepare('UPDATE knowledge_articles SET views = views + 1 WHERE id = ?').run(id)
  return db.prepare('SELECT * FROM knowledge_articles WHERE id = ?').get(id) as KnowledgeArticle | undefined
}

export function getArticles(page = 1, pageSize = 10, category?: string, keyword?: string): {
  list: KnowledgeArticle[]
  total: number
} {
  const offset = (page - 1) * pageSize
  let where = "WHERE status = 'published'"
  const params: any[] = []
  if (category) {
    where += ' AND category = ?'
    params.push(category)
  }
  if (keyword) {
    where += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)'
    const like = `%${keyword}%`
    params.push(like, like, like)
  }
  const total = (db.prepare(`SELECT COUNT(*) as count FROM knowledge_articles ${where}`).get(...params) as { count: number }).count
  const list = db.prepare(`
    SELECT * FROM knowledge_articles ${where}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).get(...params, pageSize, offset) as KnowledgeArticle[]
  return { list, total }
}

export function getPopularArticles(limit = 5): KnowledgeArticle[] {
  return db.prepare(`
    SELECT * FROM knowledge_articles WHERE status = 'published'
    ORDER BY (views * 0.7 + likes * 10) DESC LIMIT ?
  `).get(limit) as KnowledgeArticle[]
}

export function getHotTags(): { tag: string; count: number }[] {
  const rows = db.prepare("SELECT tags FROM knowledge_articles WHERE status = 'published' AND tags IS NOT NULL AND tags != ''").all() as { tags: string }[]
  const tagCount: Record<string, number> = {}
  for (const row of rows) {
    try {
      const tags = JSON.parse(row.tags) as string[]
      for (const tag of tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      }
    } catch { /* ignore */ }
  }
  return Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

export function updateArticle(id: string, data: Partial<Omit<KnowledgeArticle, 'id' | 'views' | 'likes' | 'created_at' | 'updated_at'>>): boolean {
  const fields: string[] = []
  const values: any[] = []
  const allowed = ['title', 'category', 'summary', 'content', 'cover_image', 'author', 'tags', 'status'] as const
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(data[key])
    }
  }
  if (fields.length === 0) return false
  fields.push("updated_at = datetime('now')")
  values.push(id)
  const info = db.prepare(`UPDATE knowledge_articles SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return info.changes > 0
}

export function deleteArticle(id: string): boolean {
  const info = db.prepare('DELETE FROM knowledge_articles WHERE id = ?').run(id)
  return info.changes > 0
}

export function likeArticle(id: string): boolean {
  const info = db.prepare('UPDATE knowledge_articles SET likes = likes + 1 WHERE id = ?').run(id)
  return info.changes > 0
}

export function getArticleCategories(): { category: string; count: number }[] {
  return db.prepare(`
    SELECT category, COUNT(*) as count FROM knowledge_articles
    WHERE status = 'published' GROUP BY category ORDER BY count DESC
  `).all() as { category: string; count: number }[]
}
