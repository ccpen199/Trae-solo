import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const query = String(req.query.q || req.query.keyword || '').trim()
  const like = `%${query}%`

  if (!query) {
    res.json({
      success: true,
      data: {
        keyword: query,
        communities: [],
        properties: [],
        agents: [],
        total: 0,
      },
    })
    return
  }

  const communities = db.prepare(
    `SELECT id, name, district, avg_price
     FROM communities
     WHERE name LIKE ? OR district LIKE ? OR school_district LIKE ? OR address LIKE ?
     ORDER BY id DESC
     LIMIT 8`,
  ).all(like, like, like, like)

  const properties = db.prepare(
    `SELECT p.id, p.title, p.type, p.price, p.area, c.name as community_name, c.district
     FROM properties p
     LEFT JOIN communities c ON p.community_id = c.id
     LEFT JOIN agents a ON p.agent_id = a.id
     WHERE p.status = 'active'
       AND (p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR c.district LIKE ? OR a.name LIKE ?)
     ORDER BY p.is_featured DESC, p.created_at DESC
     LIMIT 8`,
  ).all(like, like, like, like, like)

  const agents = db.prepare(
    `SELECT id, name, rating, deal_count
     FROM agents
     WHERE name LIKE ?
     ORDER BY rating DESC, deal_count DESC
     LIMIT 8`,
  ).all(like)

  res.json({
    success: true,
    data: {
      keyword: query,
      communities,
      properties,
      agents,
      total: communities.length + properties.length + agents.length,
    },
  })
})

export default router
