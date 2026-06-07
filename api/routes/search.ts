import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim()
    const type = req.query.type as string || 'all'
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const offset = (page - 1) * pageSize

    if (!q) {
      res.status(200).json({
        success: true,
        data: {
          results: [],
          total: 0,
          page,
          pageSize,
          breakdown: { properties: 0, lives: 0, cases: 0, contents: 0 }
        }
      })
      return
    }

    const searchTerm = `%${q}%`
    let totalProperties = 0, totalLives = 0, totalCases = 0, totalContents = 0
    const results: any[] = []

    if (type === 'all' || type === 'properties') {
      const propStmt = db.prepare(`
        SELECT p.*, u.nickname as publisher_name,
          'property' as result_type,
          '房源' as type_label
        FROM properties p
        LEFT JOIN users u ON p.publisher_id = u.id
        WHERE p.status = 'active' AND (
          p.title LIKE ? OR p.city LIKE ? OR p.district LIKE ? OR
          p.community LIKE ? OR p.address LIKE ? OR p.description LIKE ?
        )
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `)
      const props = propStmt.all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, pageSize, offset) as any[]
      props.forEach(p => {
        p.images = p.images ? JSON.parse(p.images) : []
      })
      results.push(...props)

      const countStmt = db.prepare(`
        SELECT COUNT(*) as count FROM properties
        WHERE status = 'active' AND (
          title LIKE ? OR city LIKE ? OR district LIKE ? OR
          community LIKE ? OR address LIKE ? OR description LIKE ?
        )
      `)
      totalProperties = (countStmt.get(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm) as any).count
    }

    if (type === 'all' || type === 'lives') {
      const liveStmt = db.prepare(`
        SELECT l.*, u.nickname as host_name,
          'live' as result_type,
          '直播' as type_label
        FROM lives l
        LEFT JOIN users u ON l.host_id = u.id
        WHERE l.status IN ('live', 'scheduled', 'ended') AND (
          l.title LIKE ? OR u.nickname LIKE ?
        )
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `)
      const lives = liveStmt.all(searchTerm, searchTerm, pageSize, offset) as any[]
      results.push(...lives)

      const countStmt = db.prepare(`
        SELECT COUNT(*) as count FROM lives l
        LEFT JOIN users u ON l.host_id = u.id
        WHERE l.status IN ('live', 'scheduled', 'ended') AND (
          l.title LIKE ? OR u.nickname LIKE ?
        )
      `)
      totalLives = (countStmt.get(searchTerm, searchTerm) as any).count
    }

    if (type === 'all' || type === 'cases') {
      const caseStmt = db.prepare(`
        SELECT c.*, co.name as company_name,
          'case' as result_type,
          '装修案例' as type_label
        FROM renovation_cases c
        LEFT JOIN renovation_companies co ON c.company_id = co.id
        WHERE (
          c.title LIKE ? OR c.style LIKE ? OR c.description LIKE ?
        )
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `)
      const cases = caseStmt.all(searchTerm, searchTerm, searchTerm, pageSize, offset) as any[]
      cases.forEach(c => {
        c.images = c.images ? JSON.parse(c.images) : []
      })
      results.push(...cases)

      const countStmt = db.prepare(`
        SELECT COUNT(*) as count FROM renovation_cases
        WHERE (
          title LIKE ? OR style LIKE ? OR description LIKE ?
        )
      `)
      totalCases = (countStmt.get(searchTerm, searchTerm, searchTerm) as any).count
    }

    if (type === 'all' || type === 'contents') {
      const contentStmt = db.prepare(`
        SELECT c.*, u.nickname as author_name,
          'content' as result_type,
          '内容' as type_label
        FROM contents c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.review_status = 'approved' AND (
          c.title LIKE ? OR c.body LIKE ? OR u.nickname LIKE ?
        )
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `)
      const contents = contentStmt.all(searchTerm, searchTerm, searchTerm, pageSize, offset) as any[]
      contents.forEach(c => {
        c.media_urls = c.media_urls ? JSON.parse(c.media_urls) : []
      })
      results.push(...contents)

      const countStmt = db.prepare(`
        SELECT COUNT(*) as count FROM contents c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.review_status = 'approved' AND (
          c.title LIKE ? OR c.body LIKE ? OR u.nickname LIKE ?
        )
      `)
      totalContents = (countStmt.get(searchTerm, searchTerm, searchTerm) as any).count
    }

    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const total = totalProperties + totalLives + totalCases + totalContents

    res.status(200).json({
      success: true,
      data: {
        results: results.slice(0, pageSize),
        total,
        page,
        pageSize,
        breakdown: {
          properties: totalProperties,
          lives: totalLives,
          cases: totalCases,
          contents: totalContents
        }
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ success: false, error: '搜索失败' })
  }
})

router.get('/suggest', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string || '').trim()
    if (!q || q.length < 2) {
      res.status(200).json({ success: true, data: { suggestions: [] } })
      return
    }

    const searchTerm = `%${q}%`
    const suggestions: { text: string; type: string; count: number }[] = []

    const propCities = db.prepare(`
      SELECT DISTINCT city as text, 'city' as type, COUNT(*) as count
      FROM properties WHERE status = 'active' AND city LIKE ?
      GROUP BY city ORDER BY count DESC LIMIT 3
    `).all(searchTerm) as any[]
    suggestions.push(...propCities)

    const propTitles = db.prepare(`
      SELECT title as text, 'property' as type, 1 as count
      FROM properties WHERE status = 'active' AND title LIKE ?
      ORDER BY created_at DESC LIMIT 5
    `).all(searchTerm) as any[]
    suggestions.push(...propTitles)

    const liveTitles = db.prepare(`
      SELECT title as text, 'live' as type, 1 as count
      FROM lives WHERE status IN ('live', 'scheduled') AND title LIKE ?
      ORDER BY created_at DESC LIMIT 3
    `).all(searchTerm) as any[]
    suggestions.push(...liveTitles)

    res.status(200).json({
      success: true,
      data: { suggestions: suggestions.slice(0, 10) }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取搜索建议失败' })
  }
})

export default router
